import { NextRequest, NextResponse } from 'next/server'

async function getAdmin() {
  try {
    const mod = await import('@/lib/supabaseAdmin')
    return mod.supabaseAdmin
  } catch {
    return null
  }
}

export async function GET() {
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
      image_url: body.image_url?.trim() || null,
      gallery_urls: Array.isArray(body.gallery_urls) ? body.gallery_urls : [],
      brand: body.brand?.trim() || null,
      specifications: typeof body.specifications === 'object' ? body.specifications : {},
      weight_kg: body.weight_kg ? parseFloat(body.weight_kg) : null,
      dimensions: body.dimensions?.trim() || null,
      material: body.material?.trim() || null,
      is_available: body.is_available ?? true,
      is_featured: body.is_featured ?? false,
      is_new: body.is_new ?? false,
    }

    const { data, error } = await supabaseAdmin.from('shop_products').insert(payload).select().single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error creating shop product:', error)
    return NextResponse.json({ error: error.message || 'Failed to create shop product' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
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
    if (fields.image_url !== undefined) payload.image_url = fields.image_url?.trim() || null
    if (fields.gallery_urls !== undefined) payload.gallery_urls = Array.isArray(fields.gallery_urls) ? fields.gallery_urls : []
    if (fields.brand !== undefined) payload.brand = fields.brand?.trim() || null
    if (fields.specifications !== undefined) payload.specifications = typeof fields.specifications === 'object' ? fields.specifications : {}
    if (fields.weight_kg !== undefined) payload.weight_kg = fields.weight_kg ? parseFloat(fields.weight_kg) : null
    if (fields.dimensions !== undefined) payload.dimensions = fields.dimensions?.trim() || null
    if (fields.material !== undefined) payload.material = fields.material?.trim() || null
    if (fields.is_available !== undefined) payload.is_available = fields.is_available
    if (fields.is_featured !== undefined) payload.is_featured = fields.is_featured
    if (fields.is_new !== undefined) payload.is_new = fields.is_new

    const { data, error } = await supabaseAdmin.from('shop_products').update(payload).eq('id', id).select().single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error updating shop product:', error)
    return NextResponse.json({ error: error.message || 'Failed to update shop product' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
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
