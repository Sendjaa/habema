import { NextRequest, NextResponse } from 'next/server'
import { activitySlugs } from '@/lib/activities'
import { requireAdmin } from '@/lib/admin-auth'

async function getAdmin() {
  try {
    const mod = await import('@/lib/supabaseAdmin')
    return mod.supabaseAdmin
  } catch {
    return null
  }
}

/**
 * Hanya slug kegiatan yang dikenal lib/activities.ts; sisanya dibuang, bukan
 * ditolak — produk boleh disimpan meski satu slug salah ketik. Urutan tidak
 * penting (array dipakai untuk penyaringan), jadi disusun ulang biar stabil.
 */
function normalizeActivities(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const known = new Set<string>(activitySlugs)
  return [...new Set(value.filter((v): v is string => typeof v === 'string' && known.has(v)))].sort()
}

/**
 * Kolom activities bisa tidak dikenali karena migrasi belum jalan, atau karena
 * PostgREST lokal masih memegang schema cache lama. Dua-duanya bikin tag
 * kegiatan hilang tanpa error — makanya retry-nya dibalas warning.
 */
const ACTIVITIES_WARNING =
  'Tag kegiatan tidak tersimpan — kolom shop_products.activities tidak dikenali. ' +
  "Jalankan migrasi 20261106000001, lalu reload schema cache (NOTIFY pgrst, 'reload schema')."

const VARIANT_TYPES = new Set(['size', 'color', 'other'])

/**
 * Varian disimpan sebagai JSONB di shop_products.variants:
 * { name, type: 'size'|'color'|'other', price, stock, sku, image_url }.
 * Nilai tidak dikenal dibuang agar data di DB tetap konsisten.
 */
function normalizeVariants(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return []
  return value
    .filter((v): v is Record<string, unknown> => !!v && typeof v === 'object')
    .map((v) => ({
      name: typeof v.name === 'string' ? v.name.trim() : '',
      type: VARIANT_TYPES.has(String(v.type)) ? String(v.type) : 'other',
      price:
        v.price === null || v.price === undefined || v.price === ''
          ? null
          : Number.isFinite(Number(v.price))
            ? Number(v.price)
            : null,
      stock: Math.max(0, Math.trunc(Number(v.stock) || 0)),
      sku: typeof v.sku === 'string' && v.sku.trim() ? v.sku.trim() : null,
      image_url: typeof v.image_url === 'string' && v.image_url.trim() ? v.image_url.trim() : null,
    }))
    .filter((v) => v.name !== '')
}

export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const supabaseAdmin = await getAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Database not configured' }, { status: 503 })

  const { data, error } = await supabaseAdmin
    .from('shop_products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching shop products:', error)
    return NextResponse.json({ error: 'Failed to fetch shop products' }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const supabaseAdmin = await getAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Database not configured' }, { status: 503 })

  try {
    const body = await req.json()

    const payload: Record<string, any> = {
      name: body.name?.trim(),
      description: body.description?.trim() || null,
      price: parseFloat(body.price) || 0,
      original_price: body.original_price ? parseFloat(body.original_price) : null,
      stock: parseInt(body.stock) || 0,
      category: body.category?.trim() || null,
      activities: normalizeActivities(body.activities),
      image_url: body.image_url?.trim() || null,
      gallery_urls: Array.isArray(body.gallery_urls) ? body.gallery_urls : [],
      brand: body.brand?.trim() || null,
      specifications: typeof body.specifications === 'object' ? body.specifications : {},
      rating_label: body.rating_label?.trim() || null,
      weight_kg: body.weight_kg ? parseFloat(body.weight_kg) : null,
      dimensions: body.dimensions?.trim() || null,
      material: body.material?.trim() || null,
      is_available: body.is_available ?? true,
      is_featured: body.is_featured ?? false,
      is_new: body.is_new ?? false,
      has_variants: body.has_variants ?? false,
      variants: normalizeVariants(body.variants),
    }

    const { data, error } = await (supabaseAdmin.from('shop_products') as any).insert(payload).select().single()

    if (error && /activities/i.test(error.message)) {
      // Environment yang belum menjalankan 20261106000001 belum punya kolom
      // activities — jangan gagalkan seluruh simpan produk karenanya.
      delete payload.activities
      const retry = await (supabaseAdmin.from('shop_products') as any).insert(payload).select().single()
      if (retry.error) throw retry.error
      return NextResponse.json({ success: true, data: retry.data, warning: ACTIVITIES_WARNING })
    }

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error creating shop product:', error)
    return NextResponse.json({ error: error.message || 'Failed to create shop product' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const supabaseAdmin = await getAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Database not configured' }, { status: 503 })

  try {
    const body = await req.json()
    const { id, ...fields } = body

    if (!id) return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })

    const payload: Record<string, any> = {}
    if (fields.name !== undefined) payload.name = fields.name?.trim()
    if (fields.description !== undefined) payload.description = fields.description?.trim() || null
    if (fields.price !== undefined) payload.price = parseFloat(fields.price) || 0
    if (fields.original_price !== undefined) payload.original_price = fields.original_price ? parseFloat(fields.original_price) : null
    if (fields.stock !== undefined) payload.stock = parseInt(fields.stock) || 0
    if (fields.category !== undefined) payload.category = fields.category?.trim() || null
    if (fields.activities !== undefined) payload.activities = normalizeActivities(fields.activities)
    if (fields.image_url !== undefined) payload.image_url = fields.image_url?.trim() || null
    if (fields.gallery_urls !== undefined) payload.gallery_urls = Array.isArray(fields.gallery_urls) ? fields.gallery_urls : []
    if (fields.brand !== undefined) payload.brand = fields.brand?.trim() || null
    if (fields.rating_label !== undefined) payload.rating_label = fields.rating_label?.trim() || null
    if (fields.specifications !== undefined) payload.specifications = typeof fields.specifications === 'object' ? fields.specifications : {}
    if (fields.weight_kg !== undefined) payload.weight_kg = fields.weight_kg ? parseFloat(fields.weight_kg) : null
    if (fields.dimensions !== undefined) payload.dimensions = fields.dimensions?.trim() || null
    if (fields.material !== undefined) payload.material = fields.material?.trim() || null
    if (fields.is_available !== undefined) payload.is_available = fields.is_available
    if (fields.is_featured !== undefined) payload.is_featured = fields.is_featured
    if (fields.is_new !== undefined) payload.is_new = fields.is_new
    if (fields.has_variants !== undefined) payload.has_variants = fields.has_variants
    if (fields.variants !== undefined) payload.variants = normalizeVariants(fields.variants)

    const { data, error } = await (supabaseAdmin.from('shop_products') as any).update(payload).eq('id', id).select().single()

    if (error && /activities/i.test(error.message)) {
      delete payload.activities
      const retry = await (supabaseAdmin.from('shop_products') as any).update(payload).eq('id', id).select().single()
      if (retry.error) throw retry.error
      return NextResponse.json({ success: true, data: retry.data, warning: ACTIVITIES_WARNING })
    }

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error updating shop product:', error)
    return NextResponse.json({ error: error.message || 'Failed to update shop product' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const supabaseAdmin = await getAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Database not configured' }, { status: 503 })

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })

    const { error } = await supabaseAdmin.from('shop_products').delete().eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting shop product:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete shop product' }, { status: 500 })
  }
}
