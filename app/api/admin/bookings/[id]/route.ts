import { NextResponse } from 'next/server'

async function getSupabase() {
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

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()

    if (bookingError) {
      return NextResponse.json({ error: bookingError.message }, { status: 404 })
    }

    const { data: items } = await supabaseAdmin
      .from('booking_items')
      .select(`
        *,
        equipment (
          name,
          description,
          image_url
        )
      `)
      .eq('booking_id', id)

    // Fetch user profile
    let userProfile = null
    if (booking.user_id) {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('email, full_name')
        .eq('id', booking.user_id)
        .single()
      userProfile = user || null
    }

    return NextResponse.json({
      success: true,
      data: { booking: { ...booking, user_profile: userProfile }, items: items || [] },
    })
  } catch (error) {
    console.error('Admin booking detail API Error:', error)
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
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('bookings')
      .update({ status })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin booking update API Error:', error)
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
      .from('bookings')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin booking delete API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
