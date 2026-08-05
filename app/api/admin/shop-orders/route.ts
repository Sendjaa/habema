import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    let supabaseAdmin: any
    try {
      const mod = await import('@/lib/supabaseAdmin')
      supabaseAdmin = mod.supabaseAdmin
    } catch {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get('search') || ''
    const statusFilter = searchParams.get('status') || 'all'
    const paymentFilter = searchParams.get('payment') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const itemsPerPage = parseInt(searchParams.get('perPage') || '10')

    let query = supabaseAdmin.from('shop_orders').select('*', { count: 'exact' })

    if (searchTerm) {
      query = query.or(
        `customer_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,order_id.ilike.%${searchTerm}%,id.ilike.%${searchTerm}%`
      )
    }
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }
    if (paymentFilter !== 'all') {
      query = query.eq('payment_status', paymentFilter)
    }

    const from = (page - 1) * itemsPerPage
    const to = from + itemsPerPage - 1

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Enrich: user profile
    let userMap: Record<string, any> = {}
    const userIds = [...new Set((data || []).map((o: any) => o.user_id).filter(Boolean))]
    if (userIds.length > 0) {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, email, full_name')
        .in('id', userIds)
      if (users) {
        for (const u of users) userMap[u.id] = u
      }
    }

    // Enrich: discount code
    let discountMap: Record<string, any> = {}
    const discountIds = [...new Set((data || []).map((o: any) => o.discount_id).filter(Boolean))]
    if (discountIds.length > 0) {
      const { data: discounts } = await supabaseAdmin
        .from('discounts')
        .select('id, code, discount_type, discount_value')
        .in('id', discountIds)
      if (discounts) {
        for (const d of discounts) discountMap[d.id] = d
      }
    }

    // Enrich: items per order (dengan info produk untuk image)
    const orderIds = (data || []).map((o: any) => o.id)
    let itemsByOrder: Record<string, any[]> = {}
    let productMap: Record<string, any> = {}
    if (orderIds.length > 0) {
      const { data: items, error: itemsError } = await supabaseAdmin
        .from('shop_order_items')
        .select('*')
        .in('order_id', orderIds)
      if (itemsError) {
        console.warn('Admin shop-orders: gagal ambil items:', itemsError.message)
      }
      if (items) {
        const productIds = [...new Set(items.map((i: any) => i.product_id).filter(Boolean))]
        if (productIds.length > 0) {
          const { data: products } = await supabaseAdmin
            .from('shop_products')
            .select('id, name, image_url')
            .in('id', productIds)
          if (products) {
            for (const p of products) productMap[p.id] = p
          }
        }
        for (const item of items) {
          if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = []
          itemsByOrder[item.order_id].push({ ...item, product: productMap[item.product_id] || null })
        }
      }
    }

    const enrichedData = (data || []).map((o: any) => ({
      ...o,
      user_profile: o.user_id ? userMap[o.user_id] || null : null,
      discount: o.discount_id ? discountMap[o.discount_id] || null : null,
      items: itemsByOrder[o.id] || [],
    }))

    return NextResponse.json({
      success: true,
      data: enrichedData,
      count: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / itemsPerPage),
    })
  } catch (error) {
    console.error('Admin shop-orders API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
