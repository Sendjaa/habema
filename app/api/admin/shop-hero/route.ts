import { NextRequest, NextResponse } from 'next/server'
import { mkdir, rm, writeFile } from 'fs/promises'
import { join } from 'path'
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { shopHero } from '@/lib/db/schema'
import { DEV_LOCAL_AUTH } from '@/lib/dev-local-auth'
import { requireAdmin } from '@/lib/admin-auth'
import { revalidateHome } from '@/lib/home-data'
import { revalidatePath } from 'next/cache'

const BUCKET = 'shop-hero'
const MAX_SIZE = 50 * 1024 * 1024 // 50MB untuk video
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
const DEV_URL_PREFIX = '/uploads/shop-hero'
const DEV_DIR = join('public', DEV_URL_PREFIX)

function connectDb() {
  try {
    return { db: getDb() }
  } catch (e: any) {
    return { error: NextResponse.json({ error: text(e) }, { status: 503 }) }
  }
}

function text(e: any): string {
  return e instanceof Error ? e.message : String(e)
}

function trim(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function fileName(file: File): string {
  const raw = file.name.split('.').pop() ?? ''
  const ext = raw.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 4) || 'jpg'
  const suffix = Math.random().toString(36).slice(2, 8)
  return `hero-${Date.now()}-${suffix}.${ext}`
}

function isVideo(file: File): boolean {
  return file.type.startsWith('video/')
}

async function storeHeroMedia(file: File): Promise<string> {
  const bytes = Buffer.from(await file.arrayBuffer())
  const name = fileName(file)

  if (DEV_LOCAL_AUTH) {
    const dir = join(process.cwd(), DEV_DIR)
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, name), bytes)
    return `${DEV_URL_PREFIX}/${name}`
  }

  const { supabaseAdmin } = await import('@/lib/supabaseAdmin')
  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(name, bytes, { contentType: file.type, upsert: false })

  if (uploadError) {
    throw new Error(
      uploadError.message.includes('bucket')
        ? `Bucket Storage "${BUCKET}" belum ada. Buat bucket "shop-hero" di Supabase.`
        : `Gagal menyimpan media: ${uploadError.message}`,
    )
  }

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(name)
  if (!data?.publicUrl) throw new Error('URL publik media tidak bisa dibentuk')
  return data.publicUrl
}

function ownedPath(mediaUrl: string): string | null {
  const prefix = `/${BUCKET}/`
  const at = mediaUrl.indexOf(prefix)
  if (at === -1) return null
  const path = mediaUrl.slice(at + prefix.length)
  return path && !path.startsWith('http') ? decodeURIComponent(path) : null
}

async function discardOldMedia(mediaUrl: string | null | undefined) {
  if (!mediaUrl) return
  try {
    if (mediaUrl.startsWith(`${DEV_URL_PREFIX}/`)) {
      await rm(join(process.cwd(), DEV_DIR, mediaUrl.split('/').pop() ?? ''), { force: true })
      return
    }
    const path = ownedPath(mediaUrl)
    if (!path) return
    const { supabaseAdmin } = await import('@/lib/supabaseAdmin')
    await supabaseAdmin.storage.from(BUCKET).remove([path])
  } catch (e: any) {
    console.warn('[admin/shop-hero] media lama tidak terhapus:', text(e))
  }
}

function toResponse(row: any) {
  return {
    id: row.id as string,
    kicker: row.kicker as string,
    heading: row.heading as string,
    description: row.description as string,
    stats: row.stats as { value: string; label: string }[],
    ctaLabel: row.ctaLabel as string,
    ctaHref: row.ctaHref as string,
    secondaryCtaLabel: row.secondaryCtaLabel as string,
    secondaryCtaHref: row.secondaryCtaHref as string,
    note: row.note as string,
    media: row.media as { url: string; alt?: string }[],
    isActive: Boolean(row.isActive),
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : null,
  }
}

export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const conn = connectDb()
  if (conn.error) return conn.error

  try {
    const rows = await conn.db
      .select()
      .from(shopHero)
      .where(eq(shopHero.isActive, true))
      .limit(1)

    return NextResponse.json({ success: true, data: rows.map(toResponse) })
  } catch (e: any) {
    return NextResponse.json({ error: 'Database tidak tersedia', status: 503 })
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const conn = connectDb()
  if (conn.error) return conn.error

  const form = await request.formData().catch(() => null)
  if (!form) {
    return NextResponse.json({ error: 'Body harus multipart/form-data' }, { status: 400 })
  }

  const kicker = trim(form.get('kicker')) ?? 'Habema Official Store'
  const heading = trim(form.get('heading'))
  const description = trim(form.get('description'))
  const ctaLabel = trim(form.get('ctaLabel')) ?? 'Mulai Belanja'
  const ctaHref = trim(form.get('ctaHref')) ?? '/catalog_shop'
  const secondaryCtaLabel = trim(form.get('secondaryCtaLabel')) ?? 'Bundling Hemat'
  const secondaryCtaHref = trim(form.get('secondaryCtaHref')) ?? '/bundles'
  const note = trim(form.get('note')) ?? 'Produk original dengan garansi tukar 7 hari. Pembayaran aman via Midtrans.'

  if (!heading) {
    return NextResponse.json({ error: 'Judul (heading) wajib diisi' }, { status: 400 })
  }
  if (!description) {
    return NextResponse.json({ error: 'Deskripsi wajib diisi' }, { status: 400 })
  }

  // Parse stats JSON
  let stats: { value: string; label: string }[] = []
  try {
    const statsRaw = form.get('stats')
    if (statsRaw && typeof statsRaw === 'string') {
      stats = JSON.parse(statsRaw)
    }
  } catch {
    return NextResponse.json({ error: 'Format stats tidak valid (JSON)' }, { status: 400 })
  }

  // Parse media JSON (existing media URLs + alts)
  let media: { url: string; alt?: string }[] = []
  try {
    const mediaRaw = form.get('media')
    if (mediaRaw && typeof mediaRaw === 'string') {
      media = JSON.parse(mediaRaw)
    }
  } catch {
    return NextResponse.json({ error: 'Format media tidak valid (JSON)' }, { status: 400 })
  }

  // Handle new file uploads (files[])
  const files = form.getAll('files') as File[]
  const newMediaUrls: string[] = []

      for (const file of files) {
    if (file && typeof file !== 'string' && file.size > 0) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ error: `Tipe file tidak didukung: ${file.type}` }, { status: 400 })
      }
      if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: `File terlalu besar (maksimal ${MAX_SIZE / 1024 / 1024}MB)` }, { status: 400 })
      }
      try {
        const url = await storeHeroMedia(file)
        newMediaUrls.push(url)
      } catch (e: any) {
        return NextResponse.json({ error: 'Database tidak tersedia', status: 503 })
      }
    }
  }

  // Merge new media with existing (prepend new)
  const mergedMedia = [
    ...newMediaUrls.map((url, i) => ({ url, alt: form.get(`alt_${i}`) as string || undefined })),
    ...media,
  ]

  try {
    // Deactivate existing active row (single active pattern)
    const [existingActive] = await conn.db
      .select({ id: shopHero.id })
      .from(shopHero)
      .where(eq(shopHero.isActive, true))
      .limit(1)

    if (existingActive) {
      await conn.db
        .update(shopHero)
        .set({ isActive: false })
        .where(eq(shopHero.id, existingActive.id))
    }

    // Insert new active row
    const [row] = await conn.db
      .insert(shopHero)
      .values({
        kicker,
        heading,
        description,
        stats,
        ctaLabel,
        ctaHref,
        secondaryCtaLabel,
        secondaryCtaHref,
        note,
        media: mergedMedia,
        isActive: true,
      })
      .returning()

    revalidateHome()
    revalidatePath('/')
    return NextResponse.json({ success: true, data: toResponse(row) })
  } catch (e: any) {
    // Cleanup uploaded files on failure
    for (const url of newMediaUrls) await discardOldMedia(url)
    console.error('[admin/shop-hero] POST gagal:', text(e))
    return NextResponse.json({ error: text(e) }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const conn = connectDb()
  if (conn.error) return conn.error

  const body = await request.json().catch(() => ({}))

  try {
    const [existing] = await conn.db
      .select()
      .from(shopHero)
      .where(eq(shopHero.isActive, true))
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: 'Hero aktif tidak ditemukan' }, { status: 404 })
    }

    const patch: Partial<typeof shopHero.$inferInsert> = { updatedAt: new Date() }

    if ('kicker' in body) patch.kicker = trim(body.kicker) ?? existing.kicker
    if ('heading' in body) {
      const h = trim(body.heading)
      if (!h) return NextResponse.json({ error: 'Judul (heading) wajib diisi' }, { status: 400 })
      patch.heading = h
    }
    if ('description' in body) {
      const d = trim(body.description)
      if (!d) return NextResponse.json({ error: 'Deskripsi wajib diisi' }, { status: 400 })
      patch.description = d
    }
    if ('stats' in body) {
      try {
        patch.stats = JSON.parse(JSON.stringify(body.stats))
      } catch {
        return NextResponse.json({ error: 'Format stats tidak valid (JSON)' }, { status: 400 })
      }
    }
    if ('ctaLabel' in body) patch.ctaLabel = trim(body.ctaLabel) ?? existing.ctaLabel
    if ('ctaHref' in body) patch.ctaHref = trim(body.ctaHref) ?? existing.ctaHref
    if ('secondaryCtaLabel' in body) patch.secondaryCtaLabel = trim(body.secondaryCtaLabel) ?? existing.secondaryCtaLabel
    if ('secondaryCtaHref' in body) patch.secondaryCtaHref = trim(body.secondaryCtaHref) ?? existing.secondaryCtaHref
    if ('note' in body) patch.note = trim(body.note) ?? existing.note
    if ('media' in body) {
      try {
        patch.media = JSON.parse(JSON.stringify(body.media))
      } catch {
        return NextResponse.json({ error: 'Format media tidak valid (JSON)' }, { status: 400 })
      }
    }
    if ('isActive' in body) patch.isActive = body.isActive !== false

    const [row] = await conn.db
      .update(shopHero)
      .set(patch)
      .where(eq(shopHero.id, existing.id))
      .returning()

    revalidateHome()
    revalidatePath('/')
    return NextResponse.json({ success: true, data: toResponse(row) })
  } catch (e: any) {
    return NextResponse.json({ error: 'Database tidak tersedia', status: 503 })
  }
}

export async function DELETE(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const conn = connectDb()
  if (conn.error) return conn.error

  const id = request.nextUrl.searchParams.get('id')?.trim() ?? ''
  if (!id) {
    return NextResponse.json({ error: 'ID tidak dikirim' }, { status: 400 })
  }

  try {
    const [row] = await conn.db
      .delete(shopHero)
      .where(eq(shopHero.id, id))
      .returning()

    if (!row) {
      return NextResponse.json({ error: 'Hero tidak ditemukan' }, { status: 404 })
    }

    // Cleanup media
    if (row.media && Array.isArray(row.media)) {
      for (const m of row.media) await discardOldMedia(m.url)
    }

    revalidateHome()
    revalidatePath('/')
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: 'Database tidak tersedia', status: 503 })
  }
}