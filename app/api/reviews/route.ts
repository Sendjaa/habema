import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

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

export async function POST(req: NextRequest) {
  const user = await getServerUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Harus login untuk mengulas' }, { status: 401 })
  }

  const body = await req.json()
  const { equipmentId, shopProductId, rating, comment } = body

  if (!equipmentId && !shopProductId) {
    return NextResponse.json({ error: 'Produk tidak valid' }, { status: 400 })
  }

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating harus 1-5' }, { status: 400 })
  }

  if (!comment || comment.trim().length < 10) {
    return NextResponse.json({ error: 'Ulasan minimal 10 karakter' }, { status: 400 })
  }

  // Cek eligibility: user harus sudah membeli/menyewa produk ini
  if (shopProductId) {
    // Produk toko: cek order delivered yang mengandung produk ini
    const { data: orders } = await supabaseAdmin
      .from('shop_orders')
      .select('id, items')
      .eq('user_id', user.id)
      .eq('status', 'delivered')
      .neq('payment_status', 'cancelled')

    const hasPurchased = (orders || []).some((o: any) =>
      (o.items || []).some((item: any) => item.product_id === shopProductId)
    )

    if (!hasPurchased) {
      return NextResponse.json(
        { error: 'Anda hanya bisa mengulas produk yang sudah dibeli dan diterima' },
        { status: 403 }
      )
    }
  } else if (equipmentId) {
    // Rental: cek booking completed/returned untuk equipment ini
    const { data: bookingItems } = await supabaseAdmin
      .from('booking_items')
      .select('booking_id')
      .eq('equipment_id', equipmentId)

    const bookingIds = new Set((bookingItems || []).map((bi: any) => bi.booking_id))
    const { data: userCompletedBookings } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq('user_id', user.id)
      .in('status', ['returned', 'completed'])
      .neq('payment_status', 'cancelled')

    const userCompletedBookingIds = new Set((userCompletedBookings || []).map((b: any) => b.id))
    const hasRented = [...bookingIds].some((id) => userCompletedBookingIds.has(id))

    if (!hasRented) {
      return NextResponse.json(
        { error: 'Anda hanya bisa mengulas alat yang sudah disewa dan dikembalikan' },
        { status: 403 }
      )
    }
  }

  // Insert review
  const insertData: any = {
    user_id: user.id,
    rating,
    comment: comment.trim(),
    created_at: new Date().toISOString(),
  }

  if (shopProductId) insertData.shop_product_id = shopProductId
  if (equipmentId) insertData.equipment_id = equipmentId

  const { data, error } = await (supabaseAdmin as any)
    .from('reviews')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    console.error('Review insertion error:', error)
    return NextResponse.json(
      { error: `Gagal menyimpan ulasan: ${error.message}` },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data })
}

export async function GET(req: NextRequest) {
  const user = await getServerUser(req)
  if (!user) {
    return NextResponse.json({ canReview: false, reason: 'Belum login' })
  }

  const { searchParams } = new URL(req.url)
  const equipmentId = searchParams.get('equipmentId')
  const shopProductId = searchParams.get('shopProductId')

  if (!equipmentId && !shopProductId) {
    return NextResponse.json({ error: 'Produk tidak valid' }, { status: 400 })
  }

  if (shopProductId) {
    const { data: orders } = await supabaseAdmin
      .from('shop_orders')
      .select('id, items')
      .eq('user_id', user.id)
      .eq('status', 'delivered')
      .neq('payment_status', 'cancelled')

    const hasPurchased = (orders || []).some((o: any) =>
      (o.items || []).some((item: any) => item.product_id === shopProductId)
    )

    if (!hasPurchased) {
      return NextResponse.json({
        canReview: false,
        reason: 'Anda hanya bisa mengulas produk yang sudah dibeli dan diterima',
      })
    }
  } else if (equipmentId) {
    const { data: bookingItems } = await supabaseAdmin
      .from('booking_items')
      .select('booking_id')
      .eq('equipment_id', equipmentId)

    const bookingIds = new Set((bookingItems || []).map((bi: any) => bi.booking_id))
    const { data: userCompletedBookings } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq('user_id', user.id)
      .in('status', ['returned', 'completed'])
      .neq('payment_status', 'cancelled')

    const userCompletedBookingIds = new Set((userCompletedBookings || []).map((b: any) => b.id))
    const hasRented = [...bookingIds].some((id) => userCompletedBookingIds.has(id))

    if (!hasRented) {
      return NextResponse.json({
        canReview: false,
        reason: 'Anda hanya bisa mengulas alat yang sudah disewa dan dikembalikan',
      })
    }
  }

  return NextResponse.json({ canReview: true })
}