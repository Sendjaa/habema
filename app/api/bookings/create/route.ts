import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    let supabaseAdmin: any
    let ensureUserRecord: ((userId: string) => Promise<void>) | undefined
    try {
      const mod = await import('@/lib/supabaseAdmin')
      supabaseAdmin = mod.supabaseAdmin
      ensureUserRecord = mod.ensureUserRecord
    } catch (e: any) {
      console.error('Supabase admin init failed:', e.message)
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { orderData, itemData, userEmail } = body

    if (!orderData || !itemData) {
      return NextResponse.json(
        { error: 'Missing required fields: orderData, itemData' },
        { status: 400 }
      )
    }

    // Normalize itemData to array (support single object or array)
    const itemsArray = Array.isArray(itemData) ? itemData : [itemData]

    if (itemsArray.length === 0) {
      return NextResponse.json(
        { error: 'itemData must contain at least one item' },
        { status: 400 }
      )
    }

    // Pastikan baris public.users ada. bookings.user_id -> public.users.id,
    // bila user login tidak punya baris users, INSERT gagal FK (23503).
    if (orderData?.user_id && ensureUserRecord) {
      await ensureUserRecord(orderData.user_id)
    }

    // Insert booking
    const { data: newBooking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert(orderData)
      .select()
      .single()

    if (bookingError) {
      console.error('Error creating booking:', bookingError)
      return NextResponse.json(
        {
          error: 'Failed to create booking',
          detail: bookingError.message,
          code: bookingError.code,
          hint: bookingError.hint ?? null,
        },
        { status: 500 }
      )
    }

    // Insert all booking items
    const bookingItems = itemsArray.map((item: any) => ({
      ...item,
      booking_id: newBooking.id,
    }))

    const { error: itemError } = await supabaseAdmin
      .from('booking_items')
      .insert(bookingItems)

    if (itemError) {
      console.error('Error creating booking items:', itemError)
      // Rollback: hapus booking yatim agar tidak tertinggal di DB
      await supabaseAdmin
        .from('bookings')
        .delete()
        .eq('id', newBooking.id)
        .maybeSingle()
      return NextResponse.json(
        {
          error: 'Failed to create booking items',
          detail: itemError.message,
          code: itemError.code,
          hint: itemError.hint ?? null,
        },
        { status: 500 }
      )
    }

    // Create admin notification (hanya bila ada user_id; kolom notifications.user_id NOT NULL)
    try {
      if (orderData.user_id) {
        await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: orderData.user_id,
            booking_id: newBooking.id,
            title: 'Pesanan Baru',
            message: `Pesanan baru (${itemsArray.length} item) ${userEmail ? ` dari ${userEmail}` : ' (Guest User)'}`,
            notification_type: 'new_booking',
            is_read: false,
          })
      }
    } catch (notifErr) {
      console.error('Error creating notification:', notifErr)
    }

    return NextResponse.json({ success: true, data: newBooking })
  } catch (error) {
    console.error('Booking create API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
