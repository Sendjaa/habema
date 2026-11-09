import { NextRequest, NextResponse } from 'next/server'
import { mkdir, rm, writeFile } from 'fs/promises'
import { join } from 'path'
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { activityTiles } from '@/lib/db/schema'
import { DEV_LOCAL_AUTH } from '@/lib/dev-local-auth'
import { requireAdmin } from '@/lib/admin-auth'
import { revalidateHome } from '@/lib/home-data'
import {
  activities as activityCatalog,
  activitySlugs,
  fallbackActivityImage,
} from '@/lib/activities'

/**
 * Foto tile kegiatan homepage (tabel activity_tiles).
 *
 * Hanya gambarnya yang ada di database. Slug, label, blurb, dan urutan tetap
 * dari lib/activities.ts — satu-satunya sumber yang juga dipakai filter
 * /catalog_rental?kegiatan=<slug> dan form alat di /admin/equipment. Karena
 * itu GET selalu mengembalikan SEMUA kegiatan, termasuk yang belum punya baris
 * di activity_tiles; halaman admin tidak perlu membuat baris dulu.
 *
 * Foto masuk sebagai FILE, bukan URL yang diketik: POST menerima multipart dan
 * menyimpannya ke Storage, jadi tidak ada kemungkinan admin menempel tautan
 * yang mati atau host yang tidak diizinkan next/image.
 *
 * Lewat drizzle, sama seperti /api/home dan /api/admin/organizations.
 */

const BUCKET = 'activities'
const MAX_SIZE = 3 * 1024 * 1024
/** Dev lokal: foto dilayani sebagai file statis dari public/uploads/activities. */
const DEV_URL_PREFIX = '/uploads/activities'
const DEV_DIR = join('public', DEV_URL_PREFIX)

const knownSlugs = new Set<string>(activitySlugs)

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

/** Nama file: slug + waktu, ekstensi dari file asal (chars aman saja). */
function fileName(slug: string, file: File): string {
  const raw = file.name.split('.').pop() ?? ''
  const ext = raw.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 4) || 'jpg'
  return `${slug}-${Date.now()}.${ext}`
}

/**
 * Simpan byte dan balikan URL yang bisa dipakai next/image.
 *
 * Dev lokal lewat cabang file: gateway (`npm run dev:db`) tidak melayani
 * /storage/v1, jadi menulis ke Storage di sana selalu gagal. Build produksi
 * tidak pernah cocok dengan DEV_LOCAL_AUTH, jadi jalur file mati di production.
 */
async function storeTileImage(slug: string, file: File): Promise<string> {
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
        ? `Bucket Storage "${BUCKET}" belum ada. Jalankan supabase/migrations/20261106000000_activity_tiles.sql.`
        : `Gagal menyimpan foto: ${uploadError.message}`,
    )
  }

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(name)
  if (!data?.publicUrl) throw new Error('URL publik foto tidak bisa dibentuk')
  return data.publicUrl
}

/** Path objek di bucket dari URL tersimpan; null kalau bukan file kita. */
function ownedPath(imageUrl: string): string | null {
  const prefix = `/${BUCKET}/`
  const at = imageUrl.indexOf(prefix)
  if (at === -1) return null
  const path = imageUrl.slice(at + prefix.length)
  return path && !path.startsWith('http') ? decodeURIComponent(path) : null
}

/** Foto lama dibuang best-effort: penggantian foto tidak boleh meninggalkan sampah. */
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

export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const conn = connectDb()
  if (conn.error) return conn.error

  try {
    const rows = await conn.db.select().from(activityTiles)
    const bySlug = new Map(rows.map((r) => [r.slug, r]))

    const data = activityCatalog
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((a) => {
        const row = bySlug.get(a.slug)
        return {
          slug: a.slug,
          label: a.label,
          blurb: a.blurb,
          display_order: a.displayOrder,
          image_url: row?.imageUrl ?? null,
          image_alt: row?.imageAlt ?? null,
          is_active: row?.isActive ?? false,
          fallback_image: a.image ?? fallbackActivityImage,
        }
      })

    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    console.error('[admin/activities] GET gagal:', text(e))
    return NextResponse.json({ error: text(e) }, { status: 500 })
  }
}

/** POST (multipart: slug + file [+ image_alt]) — unggah foto dan simpan barisnya. */
export async function POST(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const conn = connectDb()
  if (conn.error) return conn.error

  const form = await request.formData().catch(() => null)
  if (!form) {
    return NextResponse.json({ error: 'Body harus multipart/form-data' }, { status: 400 })
  }

  const slug = trim(form.get('slug')) ?? ''
  if (!knownSlugs.has(slug)) {
    return NextResponse.json(
      { error: `Kegiatan "${slug}" tidak dikenal — daftar hidupnya di lib/activities.ts` },
      { status: 400 },
    )
  }

  const file = form.get('file')
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'File foto belum dipilih' }, { status: 400 })
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File harus berupa gambar (JPG, PNG, WebP)' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File terlalu besar (maksimal 3MB)' }, { status: 400 })
  }

  const imageAlt = trim(form.get('image_alt'))

  let imageUrl: string
  try {
    imageUrl = await storeTileImage(slug, file)
  } catch (e: any) {
    console.error('[admin/activities] upload gagal:', text(e))
    return NextResponse.json({ error: text(e) }, { status: 500 })
  }

  try {
    const [previous] = await conn.db
      .select({ imageUrl: activityTiles.imageUrl })
      .from(activityTiles)
      .where(eq(activityTiles.slug, slug))

    const [row] = await conn.db
      .insert(activityTiles)
      .values({ slug, imageUrl, imageAlt, isActive: true })
      .onConflictDoUpdate({
        target: activityTiles.slug,
        set: { imageUrl, imageAlt, isActive: true, updatedAt: new Date() },
      })
      .returning()

    if (previous && previous.imageUrl !== imageUrl) await discardOldImage(previous.imageUrl)

    revalidateHome()
    return NextResponse.json({ success: true, data: row })
  } catch (e: any) {
    await discardOldImage(imageUrl)
    console.error('[admin/activities] POST gagal:', text(e))
    return NextResponse.json({ error: text(e) }, { status: 500 })
  }
}

/** PUT — hanya teks alternatif dan status pakai; foto baru selalu lewat POST. */
export async function PUT(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const conn = connectDb()
  if (conn.error) return conn.error

  const body = await request.json().catch(() => ({}))

  const slug = typeof body.slug === 'string' ? body.slug.trim() : ''
  if (!knownSlugs.has(slug)) {
    return NextResponse.json(
      { error: `Kegiatan "${slug}" tidak dikenal — daftar hidupnya di lib/activities.ts` },
      { status: 400 },
    )
  }

  const patch: Partial<typeof activityTiles.$inferInsert> = { updatedAt: new Date() }
  if ('image_alt' in body) patch.imageAlt = trim(body.image_alt)
  // Defaultnya sama dengan kolomnya: foto baru langsung dipakai.
  if ('is_active' in body) patch.isActive = body.is_active !== false

  try {
    const [row] = await conn.db
      .update(activityTiles)
      .set(patch)
      .where(eq(activityTiles.slug, slug))
      .returning()

    if (!row) {
      return NextResponse.json(
        { error: 'Belum ada foto untuk kegiatan ini — unggah file dulu' },
        { status: 400 },
      )
    }

    revalidateHome()
    return NextResponse.json({ success: true, data: row })
  } catch (e: any) {
    console.error('[admin/activities] PUT gagal:', text(e))
    return NextResponse.json({ error: text(e) }, { status: 500 })
  }
}
