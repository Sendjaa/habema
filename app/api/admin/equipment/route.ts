import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

async function getAdmin() {
  try {
    const mod = await import('@/lib/supabaseAdmin')
    return mod.supabaseAdmin
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const supabaseAdmin = await getAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Database not configured' }, { status: 503 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')

  if (type === 'categories') {
    const { data, error } = await supabaseAdmin
      .from('equipment_categories')
      .select('id, name, description')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching equipment categories:', error)
      return NextResponse.json({ error: 'Failed to fetch equipment categories' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  }

  const { data, error } = await supabaseAdmin
    .from('equipment')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching equipment:', error)
    return NextResponse.json({ error: 'Failed to fetch equipment' }, { status: 500 })
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
      category_id: body.category_id || null,
      brand: body.brand?.trim() || null,
      description: body.description?.trim() || null,
      detailed_description: body.detailed_description?.trim() || null,
      price_per_day: parseFloat(body.price_per_day) || 0,
      price_per_night: parseFloat(body.price_per_night) || 0,
      stock_quantity: parseInt(body.stock_quantity) || 0,
      is_available: body.is_available ?? true,
      is_active: body.is_active ?? true,
      activities: Array.isArray(body.activities) ? body.activities : [],
      image_url: body.image_url?.trim() || null,
      gallery_urls: Array.isArray(body.gallery_urls) ? body.gallery_urls : [],
      capacity: body.capacity?.trim() || null,
      weight_kg: body.weight_kg ? parseFloat(body.weight_kg) : null,
      dimensions: body.dimensions?.trim() || null,
      material: body.material?.trim() || null,
      weather_rating: body.weather_rating?.trim() || null,
      specifications: typeof body.specifications === 'object' ? body.specifications : null,
      is_promo: body.is_promo ?? false,
      discount_percentage: body.discount_percentage ? parseFloat(body.discount_percentage) : null,
      promo_price_per_night: body.promo_price_per_night ? parseFloat(body.promo_price_per_night) : null,
      promo_start_date: body.promo_start_date || null,
      promo_end_date: body.promo_end_date || null,
    }

    let { data, error } = await supabaseAdmin.from('equipment').insert(payload as any).select().single()

    // Environment yang belum menjalankan migrasi 20261104000000 belum punya
    // kolom activities. Jangan gagalkan seluruh simpan produk karenanya.
    if (error && /activities/i.test(error.message)) {
      delete payload.activities
      ;({ data, error } = await supabaseAdmin.from('equipment').insert(payload as any).select().single())
    }

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error creating equipment:', error)
    return NextResponse.json({ error: error.message || 'Failed to create equipment' }, { status: 500 })
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

    if (!id) return NextResponse.json({ error: 'Equipment ID is required' }, { status: 400 })

    const payload: Record<string, any> = {}
    if (fields.name !== undefined) payload.name = fields.name?.trim()
    if (fields.category_id !== undefined) payload.category_id = fields.category_id || null
    if (fields.brand !== undefined) payload.brand = fields.brand?.trim() || null
    if (fields.description !== undefined) payload.description = fields.description?.trim() || null
    if (fields.detailed_description !== undefined) payload.detailed_description = fields.detailed_description?.trim() || null
    if (fields.price_per_day !== undefined) payload.price_per_day = parseFloat(fields.price_per_day) || 0
    if (fields.price_per_night !== undefined) payload.price_per_night = parseFloat(fields.price_per_night) || 0
    if (fields.stock_quantity !== undefined) payload.stock_quantity = parseInt(fields.stock_quantity) || 0
    if (fields.is_available !== undefined) payload.is_available = fields.is_available
    if (fields.is_active !== undefined) payload.is_active = fields.is_active
    if (fields.activities !== undefined) payload.activities = Array.isArray(fields.activities) ? fields.activities : []
    if (fields.image_url !== undefined) payload.image_url = fields.image_url?.trim() || null
    if (fields.gallery_urls !== undefined) payload.gallery_urls = Array.isArray(fields.gallery_urls) ? fields.gallery_urls : []
    if (fields.capacity !== undefined) payload.capacity = fields.capacity?.trim() || null
    if (fields.weight_kg !== undefined) payload.weight_kg = fields.weight_kg ? parseFloat(fields.weight_kg) : null
    if (fields.dimensions !== undefined) payload.dimensions = fields.dimensions?.trim() || null
    if (fields.material !== undefined) payload.material = fields.material?.trim() || null
    if (fields.weather_rating !== undefined) payload.weather_rating = fields.weather_rating?.trim() || null
    if (fields.specifications !== undefined) payload.specifications = typeof fields.specifications === 'object' ? fields.specifications : null
    if (fields.is_promo !== undefined) payload.is_promo = fields.is_promo
    if (fields.discount_percentage !== undefined) payload.discount_percentage = fields.discount_percentage ? parseFloat(fields.discount_percentage) : null
    if (fields.promo_price_per_night !== undefined) payload.promo_price_per_night = fields.promo_price_per_night ? parseFloat(fields.promo_price_per_night) : null
    if (fields.promo_start_date !== undefined) payload.promo_start_date = fields.promo_start_date || null
    if (fields.promo_end_date !== undefined) payload.promo_end_date = fields.promo_end_date || null

    let { data, error } = await supabaseAdmin.from('equipment').update(payload as any).eq('id', id).select().single()

    if (error && payload.activities !== undefined && /activities/i.test(error.message)) {
      delete payload.activities
      ;({ data, error } = await supabaseAdmin.from('equipment').update(payload as any).eq('id', id).select().single())
    }

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error updating equipment:', error)
    return NextResponse.json({ error: error.message || 'Failed to update equipment' }, { status: 500 })
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

    if (!id) return NextResponse.json({ error: 'Equipment ID is required' }, { status: 400 })

    const { error } = await supabaseAdmin.from('equipment').delete().eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting equipment:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete equipment' }, { status: 500 })
  }
}
