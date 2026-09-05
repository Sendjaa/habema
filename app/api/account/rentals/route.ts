import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Data akun yang menyentuh tabel RLS (bookings, shop_orders, dll) dilayani
// lewat service-role agar tidak tergantung GRANT/RLS untuk role 'authenticated'
// (DB live masih 42501 pada client). Aman karena input di-validate via auth.

async function getServerUser(request: NextRequest) {
  try {
    const supabaseServer = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll() {},
        },
      },
    )
    const { data: { user } } = await supabaseServer.auth.getUser()
    return user ?? null
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const user = await getServerUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
  }
  const uid = user.id
  const db = supabaseAdmin as any

  // Bookings + items (untuk nama barang)
  let bookings: any[] = []
  try {
    const { data, error } = await db
      .from('bookings')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('[account/rentals] bookings:', error.message)
    } else if (data && data.length > 0) {
      const ids = data.map((b: any) => b.id)
      const { data: itemsData } = await db
        .from('booking_items')
        .select('booking_id, equipment (name, image_url)')
        .in('booking_id', ids)
      const itemsByBooking: Record<string, any[]> = {}
      for (const it of itemsData || []) {
        if (!itemsByBooking[it.booking_id]) itemsByBooking[it.booking_id] = []
        itemsByBooking[it.booking_id].push(it.equipment)
      }
      bookings = data.map((b: any) => ({
        id: b.id,
        items: (itemsByBooking[b.id] || []).map((e: any) => e?.name || 'Equipment'),
        item_image_url: (itemsByBooking[b.id] || [])[0]?.image_url || null,
        total: b.total_cost || 0,
        status: b.status,
        payment_status: b.payment_status || null,
        payment_method: b.payment_method || null,
        pickup_date: b.pickup_date,
        created_at: b.created_at,
        start_date: b.start_date,
        end_date: b.end_date,
        rental_days: b.rental_days,
        cancel_reason: b.cancel_reason || null,
        cancel_note: b.cancel_note || null,
      }))
    }
  } catch (e) {
    console.error('[account/rentals] bookings throw:', e)
  }

  // Shop orders + items + produk
  let shopOrders: any[] = []
  try {
    const { data, error } = await db
      .from('shop_orders')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('[account/rentals] shop_orders:', error.message)
    } else if (data && data.length > 0) {
      const orderIds = data.map((o: any) => o.id)
      const { data: itemsData } = await db
        .from('shop_order_items')
        .select('*')
        .in('order_id', orderIds)
      const productIds = Array.from(new Set((itemsData || []).map((i: any) => i.product_id).filter(Boolean)))
      let productMap: Record<string, any> = {}
      if (productIds.length > 0) {
        const { data: products } = await db
          .from('shop_products')
          .select('id, name, image_url')
          .in('id', productIds as string[])
        for (const p of products || []) productMap[p.id] = p
      }
      const itemsByOrder: Record<string, any[]> = {}
      for (const item of itemsData || []) {
        if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = []
        itemsByOrder[item.order_id].push({ ...item, product: productMap[item.product_id] || null })
      }
      shopOrders = data.map((order: any) => ({
        id: order.id,
        order_id: order.order_id,
        status: order.status,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        subtotal: order.subtotal || 0,
        discount_amount: order.discount_amount || 0,
        delivery_cost: order.delivery_cost || 0,
        total_amount: order.total_amount || 0,
        created_at: order.created_at,
        cancel_reason: order.cancel_reason || null,
        cancel_note: order.cancel_note || null,
        items: itemsByOrder[order.id] || [],
      }))
    }
  } catch (e) {
    console.error('[account/rentals] shop_orders throw:', e)
  }

  // Reviewed equipment ids (untuk "beri penilaian")
  let reviewedEquipmentIds: string[] = []
  try {
    const { data } = await db
      .from('reviews')
      .select('equipment_id')
      .eq('user_id', uid)
    reviewedEquipmentIds = Array.from(new Set((data || []).map((r: any) => r.equipment_id).filter(Boolean)))
  } catch (e) {
    console.error('[account/rentals] reviews throw:', e)
  }

  return NextResponse.json({
    success: true,
    data: { bookings, shopOrders, reviewedEquipmentIds },
  })
}
