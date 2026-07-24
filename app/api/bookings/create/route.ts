import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    let supabaseAdmin: any
    try {
      const mod = await import('@/lib/supabaseAdmin')
      supabaseAdmin = mod.supabaseAdmin
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

    // Insert booking
    const { data: newBooking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert(orderData)
      .select()
      .single()

    if (bookingError) {
      console.error('Error creating booking:', bookingError)
      return NextResponse.json(
        { error: 'Failed to create booking' },
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
      return NextResponse.json(
        { error: 'Failed to create booking items' },
        { status: 500 }
      )
    }

    // Create admin notification
    try {
      const itemNames = itemsArray.map((i: any) => i.equipment_id).join(', ')
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
