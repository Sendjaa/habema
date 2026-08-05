import { NextResponse } from 'next/server'

async function getSupabase(): Promise<any> {
  try {
    const mod = await import('@/lib/supabaseAdmin')
    return mod.supabaseAdmin
  } catch {
    return null
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabaseAdmin = await getSupabase()
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('shop_orders')
      .select('*')
      .eq('id', id)
      .single()

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 404 })
    }

    const { data: items, error: itemsError } = await supabaseAdmin
      .from('shop_order_items')
      .select('*')
      .eq('order_id', id)

    // product_id tidak punya FK ke shop_products, ambil info produk terpisah
    let productMap: Record<string, any> = {}
    const productIds = [...new Set((items || []).map((i: any) => i.product_id).filter(Boolean))]
    if (productIds.length > 0) {
      const { data: products } = await supabaseAdmin
        .from('shop_products')
        .select('id, name, description, image_url')
        .in('id', productIds)
      if (products) {
        for (const p of products) productMap[p.id] = p
      }
    }
    const enrichedItems = (items || []).map((i: any) => ({
      ...i,
      product: productMap[i.product_id] || null,
    }))

    let userProfile = null
    if (order.user_id) {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('id, email, full_name')
        .eq('id', order.user_id)
        .single()
      userProfile = user || null
    }

    let discount = null
    if (order.discount_id) {
      const { data: d } = await supabaseAdmin
        .from('discounts')
        .select('id, code, discount_type, discount_value')
        .eq('id', order.discount_id)
        .single()
      discount = d || null
    }

    return NextResponse.json({
      success: true,
      data: { order: { ...order, user_profile: userProfile, discount }, items: enrichedItems },
    })
  } catch (error) {
    console.error('Admin shop-order detail API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabaseAdmin = await getSupabase()
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const body = await request.json()
    const { status, payment_status } = body

    const updateData: Record<string, string> = {}
    if (status) updateData.status = status
    if (payment_status) updateData.payment_status = payment_status

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Tidak ada field untuk diubah' }, { status: 400 })
    }

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('shop_orders')
      .select('status, payment_status')
      .eq('id', id)
      .single()
    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 404 })
    }

    const { error } = await supabaseAdmin
      .from('shop_orders')
      .update(updateData)
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Saat order dibatalkan setelah pernah paid, kembalikan stok
    const wasPaid = existing.payment_status === 'paid'
    const isNowCancelled = (updateData.status === 'cancelled') || (updateData.payment_status === 'cancelled')
    if (wasPaid && isNowCancelled) {
      const { data: items } = await supabaseAdmin
        .from('shop_order_items')
        .select('product_id, quantity')
        .eq('order_id', id)

      for (const it of items || []) {
        const { data: prod } = await supabaseAdmin
          .from('shop_products')
          .select('stock, sold_count')
          .eq('id', it.product_id)
          .maybeSingle()
        if (!prod) continue
        await supabaseAdmin
          .from('shop_products')
          .update({
            stock: (Number(prod.stock) || 0) + Number(it.quantity),
            sold_count: Math.max(0, (Number(prod.sold_count) || 0) - Number(it.quantity)),
          })
          .eq('id', it.product_id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin shop-order update API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabaseAdmin = await getSupabase()
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const { error } = await supabaseAdmin
      .from('shop_orders')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin shop-order delete API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
