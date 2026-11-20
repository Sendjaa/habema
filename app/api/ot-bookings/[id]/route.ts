import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import type { OtBooking } from '@/lib/opentrip-types'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { id } = await params

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get booking with trip details
    const { data, error } = await (supabase as any)
      .from('ot_bookings')
      .select(`
        *,
        trip:ot_trips(id, title, slug, featured_image, final_price, departure_date, return_date, destination, max_participants, current_participants),
        payments:ot_payments(id, amount, status, payment_method, transaction_id)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) throw new Error(error.message)

    return NextResponse.json<{ data: OtBooking; success: boolean }>({ data, success: true })
  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil detail booking' },
      { status: 500 }
    )
  }
}

// PUT - Update booking (user can cancel, admin can manage all)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { id } = await params

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile && ['admin', 'super_admin'].includes(profile.role)

    // Get current booking
    const { data: currentBooking, error: fetchError } = await (supabase as any)
      .from('ot_bookings')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !currentBooking) {
      return NextResponse.json(
        { success: false, error: 'Booking tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check ownership
    if (!isAdmin && currentBooking.user_id !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (body.booking_status !== undefined) updateData.booking_status = body.booking_status
    if (body.payment_status !== undefined) updateData.payment_status = body.payment_status
    if (body.special_requests !== undefined) updateData.special_requests = body.special_requests
    if (body.cancelled_reason !== undefined) updateData.cancelled_reason = body.cancelled_reason

    // Handle status transitions
    if (body.booking_status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString()
      if (!updateData.cancelled_reason) {
        updateData.cancelled_reason = body.cancelled_reason || 'Dibatalkan oleh user'
      }
    }

    if (body.booking_status === 'confirmed') {
      updateData.confirmed_at = new Date().toISOString()
    }

    if (body.booking_status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    }

    const { data, error } = await (supabase as any)
      .from('ot_bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Gagal memperbarui booking' },
      { status: 500 }
    )
  }
}
