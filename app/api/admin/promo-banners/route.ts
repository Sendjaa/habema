import { NextRequest, NextResponse } from 'next/server'
import { mkdir, rm, writeFile } from 'fs/promises'
import { join } from 'path'
import { asc, eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { promoBanners } from '@/lib/db/schema'
import { DEV_LOCAL_AUTH } from '@/lib/dev-local-auth'
import { requireAdmin } from '@/lib/admin-auth'
import { revalidateHome } from '@/lib/home-data'

/**
 * Banner promo homepage (tabel promo_banners).
 *
 * Section "Promo" di homepage hanya menampilkan gambar kampanye — bukan produk
 * promo. Karena itu isinya dikelola di sini: judul (sekaligus teks alternatif),
 * gambar, tautan opsional, jadwal tayang, dan urutan.
 *
 * Gambar masuk sebagai FILE lewat multipart, bukan URL yang diketik, sama
 * seperti /api/admin/activities: yang tersimpan adalah file yang benar-benar
 * ada di Storage (atau public/uploads saat dev lokal), jadi banner tidak
 * mungkin menunjuk alamat yang mati.
 */
const BUCKET = 'promo-banners'
const MAX_SIZE = 5 * 1024 * 1024
/** Dev lokal: gambar dilayani sebagai file statis dari public/uploads/promo-banners. */
const DEV_URL_PREFIX = '/uploads/promo-banners'
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
  return `banner-${Date.now()}-${suffix}.${ext}`
}

async function storeBannerImage(file: File): Promise<string> {
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
        ? `Bucket Storage "${BUCKET}" belum ada. Jalankan supabase/migrations/20261106000002_promo_banners.sql.`
        : `Gagal menyimpan gambar: ${uploadError.message}`,
    )
  }

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(name)
  if (!data?.publicUrl) throw new Error('URL publik gambar tidak bisa dibentuk')
  return data.publicUrl
}

function ownedPath(imageUrl: string): string | null {
  const prefix = `/${BUCKET}/`
  const at = imageUrl.indexOf(prefix)
  if (at === -1) return null
  const path = imageUrl.slice(at + prefix.length)
  return path && !path.startsWith('http') ? decodeURIComponent(path) : null
}

/** Gambar lama dibuang best-effort; penggantian banner tidak boleh menyisakan sampah. */
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
    console.warn('[admin/promo-banners] gambar lama tidak terhapus:', text(e))
  }
}

/**
 * Tautan banner: path internal ("/bundles") atau URL http(s). Skema lain
 * (javascript:, data:, dsb.) ditolak — nilai ini dirender sebagai href.
 */
function parseLink(value: unknown): { ok: true; value: string | null } | { ok: false } {
  if (value == null) return { ok: true, value: null }
  const raw = String(value).trim()
  if (!raw) return { ok: true, value: null }
  if ((raw.startsWith('/') && !raw.startsWith('//')) || /^https?:\/\//i.test(raw)) {
    return { ok: true, value: raw }
  }
  return { ok: false }
}

function parseDate(value: unknown): { ok: true; value: Date | null } | { ok: false } {
  if (value == null) return { ok: true, value: null }
  const raw = String(value).trim()
  if (!raw) return { ok: true, value: null }
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return { ok: false }
  return { ok: true, value: date }
}

function parseOrder(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? Math.trunc(n) : 0
}

function invalidSchedule(startsAt: Date | null, endsAt: Date | null): boolean {
  return !!startsAt && !!endsAt && endsAt <= startsAt
}

/**
 * Baris drizzle memakai nama properti camelCase, sedangkan halaman admin di
 * repo ini membaca baris snake_case (seperti hasil Supabase). Diseragamkan di
 * sini, sama seperti /api/admin/organizations.
 */
function toResponse(row: any) {
  return {
    id: row.id as string,
    title: row.title as string,
    image_url: row.imageUrl as string,
    link_url: (row.linkUrl ?? null) as string | null,
    starts_at: row.startsAt ? new Date(row.startsAt).toISOString() : null,
    ends_at: row.endsAt ? new Date(row.endsAt).toISOString() : null,
    is_active: Boolean(row.isActive),
    display_order: Number(row.displayOrder ?? 0),
    created_at: row.createdAt ? new Date(row.createdAt).toISOString() : null,
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
      .from(promoBanners)
      .orderBy(asc(promoBanners.displayOrder), asc(promoBanners.createdAt))

    return NextResponse.json({ success: true, data: rows.map(toResponse) })
  } catch (e: any) {
    console.error('[admin/promo-banners] GET gagal:', text(e))
    return NextResponse.json({ error: text(e) }, { status: 500 })
  }
}

/**
 * POST multipart.
 *   - tanpa `id` → buat banner baru (file + judul + tautan + jadwal + urutan).
 *   - dengan `id` → ganti gambar banner itu saja.
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

  const file = form.get('file')
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'File gambar belum dipilih' }, { status: 400 })
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File harus berupa gambar (JPG, PNG, WebP)' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File terlalu besar (maksimal 5MB)' }, { status: 400 })
  }

  const id = trim(form.get('id'))

  // Ganti gambar banner yang sudah ada.
  if (id) {
    let uploaded: string | null = null
    let saved = false
    try {
      const [previous] = await conn.db
        .select({ imageUrl: promoBanners.imageUrl })
        .from(promoBanners)
        .where(eq(promoBanners.id, id))

      if (!previous) {
        return NextResponse.json({ error: 'Banner tidak ditemukan' }, { status: 404 })
      }

      uploaded = await storeBannerImage(file)
      const [row] = await conn.db
        .update(promoBanners)
        .set({ imageUrl: uploaded, updatedAt: new Date() })
        .where(eq(promoBanners.id, id))
        .returning()

      saved = true
      await discardOldImage(previous.imageUrl)
      revalidateHome()
      return NextResponse.json({ success: true, data: toResponse(row) })
    } catch (e: any) {
      // File baru yang gagal disimpan dibuang lagi supaya Storage tidak
      // menumpuk gambar yang tidak dipakai banner mana pun.
      if (uploaded && !saved) await discardOldImage(uploaded)
      console.error('[admin/promo-banners] ganti gambar gagal:', text(e))
      return NextResponse.json({ error: text(e) }, { status: 500 })
    }
  }

  // Buat banner baru — validasi dulu, unggah belakangan supaya file tidak
  // tertinggal di Storage saat isian form ditolak.
  const title = trim(form.get('title'))
  if (!title) {
    return NextResponse.json({ error: 'Judul banner wajib diisi' }, { status: 400 })
  }

  const link = parseLink(form.get('link_url'))
  if (!link.ok) {
    return NextResponse.json(
      { error: 'Tautan harus berupa path internal (mis. /bundles) atau URL http/https' },
      { status: 400 },
    )
  }

  const startsAt = parseDate(form.get('starts_at'))
  if (!startsAt.ok) {
    return NextResponse.json({ error: 'Tanggal mulai tidak valid' }, { status: 400 })
  }
  const endsAt = parseDate(form.get('ends_at'))
  if (!endsAt.ok) {
    return NextResponse.json({ error: 'Tanggal berakhir tidak valid' }, { status: 400 })
  }
  if (invalidSchedule(startsAt.value, endsAt.value)) {
    return NextResponse.json(
      { error: 'Tanggal berakhir harus setelah tanggal mulai' },
      { status: 400 },
    )
  }

  let imageUrl: string
  try {
    imageUrl = await storeBannerImage(file)
  } catch (e: any) {
    console.error('[admin/promo-banners] upload gagal:', text(e))
    return NextResponse.json({ error: text(e) }, { status: 500 })
  }

  try {
    const [row] = await conn.db
      .insert(promoBanners)
      .values({
        title,
        imageUrl,
        linkUrl: link.value,
        startsAt: startsAt.value,
        endsAt: endsAt.value,
        displayOrder: parseOrder(form.get('display_order')),
        isActive: String(form.get('is_active') ?? 'true') !== 'false',
      })
      .returning()

    revalidateHome()
    return NextResponse.json({ success: true, data: toResponse(row) })
  } catch (e: any) {
    await discardOldImage(imageUrl)
    console.error('[admin/promo-banners] POST gagal:', text(e))
    return NextResponse.json({ error: text(e) }, { status: 500 })
  }
}

/** PUT — ubah teks, tautan, jadwal, urutan, dan status tayang. */
export async function PUT(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const conn = connectDb()
  if (conn.error) return conn.error

  const body = await request.json().catch(() => ({}))

  const id = typeof body.id === 'string' ? body.id.trim() : ''
  if (!id) {
    return NextResponse.json({ error: 'ID banner tidak dikirim' }, { status: 400 })
  }

  try {
    const [existing] = await conn.db.select().from(promoBanners).where(eq(promoBanners.id, id))
    if (!existing) {
      return NextResponse.json({ error: 'Banner tidak ditemukan' }, { status: 404 })
    }

    const patch: Partial<typeof promoBanners.$inferInsert> = { updatedAt: new Date() }

    if ('title' in body) {
      const title = trim(body.title)
      if (!title) {
        return NextResponse.json({ error: 'Judul banner wajib diisi' }, { status: 400 })
      }
      patch.title = title
    }

    if ('link_url' in body) {
      const link = parseLink(body.link_url)
      if (!link.ok) {
        return NextResponse.json(
          { error: 'Tautan harus berupa path internal (mis. /bundles) atau URL http/https' },
          { status: 400 },
        )
      }
      patch.linkUrl = link.value
    }

    if ('starts_at' in body) {
      const startsAt = parseDate(body.starts_at)
      if (!startsAt.ok) {
        return NextResponse.json({ error: 'Tanggal mulai tidak valid' }, { status: 400 })
      }
      patch.startsAt = startsAt.value
    }

    if ('ends_at' in body) {
      const endsAt = parseDate(body.ends_at)
      if (!endsAt.ok) {
        return NextResponse.json({ error: 'Tanggal berakhir tidak valid' }, { status: 400 })
      }
      patch.endsAt = endsAt.value
    }

    const startsAt = 'starts_at' in body ? (patch.startsAt ?? null) : existing.startsAt
    const endsAt = 'ends_at' in body ? (patch.endsAt ?? null) : existing.endsAt
    if (invalidSchedule(startsAt, endsAt)) {
      return NextResponse.json(
        { error: 'Tanggal berakhir harus setelah tanggal mulai' },
        { status: 400 },
      )
    }

    if ('display_order' in body) patch.displayOrder = parseOrder(body.display_order)
    if ('is_active' in body) patch.isActive = body.is_active !== false

    const [row] = await conn.db
      .update(promoBanners)
      .set(patch)
      .where(eq(promoBanners.id, id))
      .returning()

    revalidateHome()
    return NextResponse.json({ success: true, data: toResponse(row) })
  } catch (e: any) {
    console.error('[admin/promo-banners] PUT gagal:', text(e))
    return NextResponse.json({ error: text(e) }, { status: 500 })
  }
}

/** DELETE ?id=<uuid> — hapus banner beserta gambarnya. */
export async function DELETE(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const conn = connectDb()
  if (conn.error) return conn.error

  const id = request.nextUrl.searchParams.get('id')?.trim() ?? ''
  if (!id) {
    return NextResponse.json({ error: 'ID banner tidak dikirim' }, { status: 400 })
  }

  try {
    const [row] = await conn.db
      .delete(promoBanners)
      .where(eq(promoBanners.id, id))
      .returning()

    if (!row) {
      return NextResponse.json({ error: 'Banner tidak ditemukan' }, { status: 404 })
    }

    await discardOldImage(row.imageUrl)
    revalidateHome()
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[admin/promo-banners] DELETE gagal:', text(e))
    return NextResponse.json({ error: text(e) }, { status: 500 })
  }
}
