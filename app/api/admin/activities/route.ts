import { NextRequest, NextResponse } from 'next/server'
import { mkdir, rm, writeFile } from 'fs/promises'
import { join } from 'path'
import { asc, desc, eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { activities } from '@/lib/db/schema'
import { DEV_LOCAL_AUTH } from '@/lib/dev-local-auth'
import { requireAdmin } from '@/lib/admin-auth'
import { revalidateHome } from '@/lib/home-data'

/**
 * Katalog kegiatan lengkap (CRUD). Satu-satunya sumber kebenaran untuk
 * slug, label, blurb, urutan, dan foto tile kegiatan di homepage.
 *
 * Foto masuk sebagai FILE lewat multipart, bukan URL yang diketik — sama
 * seperti /api/admin/promo-banners dan /api/admin/activities (lama).
 *
 * Endpoint:
 *   GET     /api/admin/activities   — daftar semua kegiatan
 *   POST    /api/admin/activities   — buat baru (multipart: slug, label, blurb, file?, sections?, display_order?, is_active?)
 *   PUT     /api/admin/activities   — ubah (JSON: id + field yang berubah)
 *   DELETE  /api/admin/activities?id= — hapus + foto-nya
 */

const BUCKET = 'activities'
const MAX_SIZE = 3 * 1024 * 1024
const DEV_URL_PREFIX = '/uploads/activities'
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

function parseBool(value: unknown, fallback: boolean): boolean {
  if (value == null) return fallback
  if (typeof value === 'boolean') return value
  return String(value) !== 'false'
}

function parseOrder(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? Math.trunc(n) : 0
}

function parseSections(value: unknown): string[] {
  if (value == null) return []
  if (Array.isArray(value)) return value.filter((v) => typeof v === 'string')
  if (typeof value === 'string') {
    const raw = value.trim()
    if (!raw) return []
    return raw.split(',').map((s) => s.trim()).filter(Boolean)
  }
  return []
}

function fileName(slug: string, file: File): string {
  const raw = file.name.split('.').pop() ?? ''
  const ext = raw.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 4) || 'jpg'
  return `${slug}-${Date.now()}.${ext}`
}

async function storeActivityImage(slug: string, file: File): Promise<string> {
  const bytes = Buffer.from(await file.arrayBuffer())
  const name = fileName(slug, file)

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
        ? `Bucket Storage "${BUCKET}" belum ada. Jalankan supabase/migrations/20261113000000_activities_crud.sql.`
        : `Gagal menyimpan foto: ${uploadError.message}`,
    )
  }

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(name)
  if (!data?.publicUrl) throw new Error('URL publik foto tidak bisa dibentuk')
  return data.publicUrl
}

function ownedPath(imageUrl: string): string | null {
  const prefix = `/${BUCKET}/`
  const at = imageUrl.indexOf(prefix)
  if (at === -1) return null
  const path = imageUrl.slice(at + prefix.length)
  return path && !path.startsWith('http') ? decodeURIComponent(path) : null
}

async function discardOldImage(imageUrl: string | null | undefined) {
  if (!imageUrl) return
  try {
    if (imageUrl.startsWith(`${DEV_URL_PREFIX}/`)) {
      await rm(join(process.cwd(), DEV_DIR, imageUrl.split('/').pop() ?? ''), { force: true })
      return
    }
    const path = ownedPath(imageUrl)
    if (!path) return
    const { supabaseAdmin } = await import('@/lib/supabaseAdmin')
    await supabaseAdmin.storage.from(BUCKET).remove([path])
  } catch (e: any) {
    console.warn('[admin/activities] foto lama tidak terhapus:', text(e))
  }
}

function toResponse(row: any) {
  return {
    id: row.id as string,
    slug: row.slug as string,
    label: row.label as string,
    blurb: row.blurb as string | null,
    image_url: row.imageUrl as string | null,
    image_alt: row.imageAlt as string | null,
    is_active: Boolean(row.isActive),
    display_order: Number(row.displayOrder ?? 0),
    sections: Array.isArray(row.sections) ? row.sections : [],
    created_at: row.createdAt ? new Date(row.createdAt).toISOString() : null,
    updated_at: row.updatedAt ? new Date(row.updatedAt).toISOString() : null,
  }
}

/** GET — daftar semua kegiatan, urut menurut display_order. */
export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const conn = connectDb()
  if (conn.error) return conn.error

  try {
    const rows = await conn.db
      .select()
      .from(activities)
      .orderBy(asc(activities.displayOrder), asc(activities.createdAt))

    return NextResponse.json({ success: true, data: rows.map(toResponse) })
  } catch (e: any) {
    console.error('[admin/activities] GET gagal:', text(e))
    return NextResponse.json({ error: text(e) }, { status: 500 })
  }
}

/**
 * POST multipart — buat kegiatan baru atau ganti foto kegiatan yang sudah ada.
 *
 * Tanpa `id` → buat baru. Field: slug (wajib), label (wajib), blurb, file
 * (opsional), sections (comma-separated), display_order, is_active.
 * Dengan `id` → ganti foto saja (file wajib).
 */
export async function POST(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const conn = connectDb()
  if (conn.error) return conn.error

  const form = await request.formData().catch(() => null)
  if (!form) {
    return NextResponse.json({ error: 'Body harus multipart/form-data' }, { status: 400 })
  }

  const id = trim(form.get('id'))

  // Ganti foto kegiatan yang sudah ada.
  if (id) {
    let uploaded: string | null = null
    let saved = false
    try {
      const [previous] = await conn.db
        .select({ imageUrl: activities.imageUrl })
        .from(activities)
        .where(eq(activities.id, id))

      if (!previous) {
        return NextResponse.json({ error: 'Kegiatan tidak ditemukan' }, { status: 404 })
      }

      const file = form.get('file')
      if (!file || typeof file === 'string') {
        return NextResponse.json({ error: 'File foto belum dipilih' }, { status: 400 })
      }
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: 'File harus berupa gambar (JPG, PNG, WebP)' }, { status: 400 })
      }
      if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: 'File terlalu besar — maksimal 3MB' }, { status: 400 })
      }

      uploaded = await storeActivityImage(previous.slug as string, file)
      const [row] = await conn.db
        .update(activities)
        .set({ imageUrl: uploaded, updatedAt: new Date() })
        .where(eq(activities.id, id))
        .returning()

      saved = true
      await discardOldImage(previous.imageUrl)
      revalidateHome()
      return NextResponse.json({ success: true, data: toResponse(row) })
    } catch (e: any) {
      if (uploaded && !saved) await discardOldImage(uploaded)
      console.error('[admin/activities] ganti foto gagal:', text(e))
      return NextResponse.json({ error: text(e) }, { status: 500 })
    }
  }

  // Buat kegiatan baru.
  const slug = trim(form.get('slug')) ?? ''
  if (!slug) {
    return NextResponse.json({ error: 'Slug wajib diisi' }, { status: 400 })
  }
  const label = trim(form.get('label')) ?? ''
  if (!label) {
    return NextResponse.json({ error: 'Label wajib diisi' }, { status: 400 })
  }

  const [existing] = await conn.db
    .select({ id: activities.id })
    .from(activities)
    .where(eq(activities.slug, slug))
  if (existing) {
    return NextResponse.json({ error: `Slug "${slug}" sudah digunakan` }, { status: 409 })
  }

  const blurb = trim(form.get('blurb')) ?? null
  const sections = parseSections(form.get('sections'))
  const displayOrder = parseOrder(form.get('display_order'))
  const isActive = parseBool(form.get('is_active'), true)

  let imageUrl: string | null = null
  const file = form.get('file')
  if (file && typeof file !== 'string') {
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File harus berupa gambar (JPG, PNG, WebP)' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File terlalu besar — maksimal 3MB' }, { status: 400 })
    }
    try {
      imageUrl = await storeActivityImage(slug, file)
    } catch (e: any) {
      console.error('[admin/activities] upload foto gagal:', text(e))
      return NextResponse.json({ error: text(e) }, { status: 500 })
    }
  }

  try {
    const [row] = await conn.db
      .insert(activities)
      .values({ slug, label, blurb, imageUrl, sections, displayOrder, isActive })
      .returning()

    revalidateHome()
    return NextResponse.json({ success: true, data: toResponse(row) })
  } catch (e: any) {
    if (imageUrl) await discardOldImage(imageUrl)
    console.error('[admin/activities] POST gagal:', text(e))
    return NextResponse.json({ error: text(e) }, { status: 500 })
  }
}

/** PUT JSON — ubah field teks (slug, label, blurb, sections, display_order, is_active). Foto baru lewat POST ?id=. */
export async function PUT(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const conn = connectDb()
  if (conn.error) return conn.error

  const body = await request.json().catch(() => ({}))

  const id = typeof body.id === 'string' ? body.id.trim() : ''
  if (!id) {
    return NextResponse.json({ error: 'ID kegiatan tidak dikirim' }, { status: 400 })
  }

  try {
    const [existing] = await conn.db.select().from(activities).where(eq(activities.id, id))
    if (!existing) {
      return NextResponse.json({ error: 'Kegiatan tidak ditemukan' }, { status: 404 })
    }

    const patch: Partial<typeof activities.$inferInsert> = { updatedAt: new Date() }

    if ('slug' in body) {
      const slug = trim(body.slug)
      if (!slug) {
        return NextResponse.json({ error: 'Slug wajib diisi' }, { status: 400 })
      }
      const [conflict] = await conn.db
        .select({ id: activities.id })
        .from(activities)
        .where(eq(activities.slug, slug))
      if (conflict && conflict.id !== id) {
        return NextResponse.json({ error: `Slug "${slug}" sudah digunakan` }, { status: 409 })
      }
      patch.slug = slug
    }

    if ('label' in body) {
      const label = trim(body.label)
      if (!label) {
        return NextResponse.json({ error: 'Label wajib diisi' }, { status: 400 })
      }
      patch.label = label
    }

    if ('blurb' in body) patch.blurb = trim(body.blurb) ?? null
    if ('sections' in body) patch.sections = parseSections(body.sections)
    if ('display_order' in body) patch.displayOrder = parseOrder(body.display_order)
    if ('is_active' in body) patch.isActive = body.is_active !== false

    const [row] = await conn.db
      .update(activities)
      .set(patch)
      .where(eq(activities.id, id))
      .returning()

    revalidateHome()
    return NextResponse.json({ success: true, data: toResponse(row) })
  } catch (e: any) {
    console.error('[admin/activities] PUT gagal:', text(e))
    return NextResponse.json({ error: text(e) }, { status: 500 })
  }
}

/** DELETE ?id=<uuid> — hapus kegiatan beserta foto-nya. */
export async function DELETE(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const conn = connectDb()
  if (conn.error) return conn.error

  const id = request.nextUrl.searchParams.get('id')?.trim() ?? ''
  if (!id) {
    return NextResponse.json({ error: 'ID kegiatan tidak dikirim' }, { status: 400 })
  }

  try {
    const [row] = await conn.db
      .delete(activities)
      .where(eq(activities.id, id))
      .returning()

    if (!row) {
      return NextResponse.json({ error: 'Kegiatan tidak ditemukan' }, { status: 404 })
    }

    await discardOldImage(row.imageUrl)
    revalidateHome()
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[admin/activities] DELETE gagal:', text(e))
    return NextResponse.json({ error: text(e) }, { status: 500 })
  }
}
