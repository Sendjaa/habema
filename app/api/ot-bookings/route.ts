import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import type { OtBooking, PaginatedResponse } from '@/lib/opentrip-types'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const searchParams = request.nextUrl.searchParams

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Parse filters
    const page = Math.max(1, Number(searchParams.get('page') || 1))
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || 10)))
    const status = searchParams.get('status') || undefined
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = (supabase as any)
      .from('ot_bookings')
      .select(`
        *,
        trip:ot_trips(id, title, slug, featured_image, final_price, departure_date, return_date, destination)
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .range(from, to)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('booking_status', status)
    }

    const { data, error, count } = await query

    if (error) throw new Error(error.message)

    return NextResponse.json<PaginatedResponse<OtBooking>>({
      data: (data || []) as OtBooking[],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal memuat data booking' },
      { status: 500 }
    )
  }
}

// POST - Create new booking
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      trip_id,
      total_participants,
      adult_count,
      child_count,
      infant_count,
      special_requests,
      participant_details,
      contact_person_name,
      contact_person_email,
      contact_person_phone,
      meeting_point_id,
      rental_addon_ids,
    } = body

    // Validation
    if (!trip_id || !total_participants || total_participants <= 0) {
      return NextResponse.json(
        { success: false, error: 'Trip ID dan jumlah peserta wajib diisi' },
        { status: 400 }
      )
    }

    // Get trip details
    const { data: trip, error: tripError } = await (supabase as any)
      .from('ot_trips')
      .select('id, final_price, max_participants, current_participants, status, min_participants, title, departure_date')
      .eq('id', trip_id)
      .single()

    if (tripError || !trip) {
      return NextResponse.json(
        { success: false, error: 'Trip tidak ditemukan' },
        { status: 404 }
      )
    }

    if (trip.status !== 'published') {
      return NextResponse.json(
        { success: false, error: 'Trip tidak tersedia untuk booking' },
        { status: 400 }
      )
    }

    if (total_participants < (trip.min_participants || 1)) {
      return NextResponse.json(
        { success: false, error: `Minimal peserta: ${trip.min_participants || 1}` },
        { status: 400 }
      )
    }

    // Use DB function to count available slots (includes pending slot locks)
    const { data: slotsData } = await (supabase as any)
      .rpc('count_available_slots', { p_trip_id: trip.id })
      .single()
    const availableSlots = slotsData?.count_available_slots ?? 0

    if (total_participants > availableSlots) {
      return NextResponse.json(
        { success: false, error: `Hanya tersisa ${availableSlots} slot. Hubungi CS jika butuh bantuan.` },
        { status: 400 }
      )
    }

    // Meeting point price adjustment
    let meetingPointAdjustment = 0
    if (meeting_point_id) {
      const { data: mp } = await (supabase as any)
        .from('ot_meeting_points')
        .select('price_adjustment')
        .eq('id', meeting_point_id)
        .single()
      meetingPointAdjustment = Number(mp?.price_adjustment ?? 0)
    }

    // Rental add-ons total
    let rentalAddonsPayload: any[] = []
    let addonsTotal = 0
    if (Array.isArray(rental_addon_ids) && rental_addon_ids.length > 0) {
      const { data: addons } = await (supabase as any)
        .from('ot_rental_addons')
        .select('id, equipment_id, quantity, price_per_unit, is_active')
        .in('id', rental_addon_ids)
      rentalAddonsPayload = (addons || [])
        .filter((a: any) => a.is_active)
        .map((a: any) => ({
          addon_id: a.id,
          equipment_id: a.equipment_id,
          quantity: a.quantity,
          price: a.price_per_unit,
        }))
      addonsTotal = rentalAddonsPayload.reduce((sum: number, a: any) => sum + a.price * a.quantity, 0)
    }

    // Calculate pricing
    const basePrice = trip.final_price + meetingPointAdjustment
    const subtotal_price = basePrice * total_participants + addonsTotal
    const tax_amount = 0 // Can be calculated based on tax rules
    const discount_amount = 0
    const total_price = subtotal_price + tax_amount - discount_amount

    // Generate booking code
    const booking_code = 'OT-' + new Date().toISOString().slice(2, 10).replace(/-/g, '') + '-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0')

    // Slot lock: expires in 30 minutes for pending payment
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

    const insertData = {
      user_id: user.id,
      trip_id,
      booking_code,
      total_participants,
      adult_count: adult_count || total_participants,
      child_count: child_count || 0,
      infant_count: infant_count || 0,
      subtotal_price,
      tax_amount,
      discount_amount,
      total_price,
      currency: 'IDR',
      booking_status: 'pending',
      payment_status: 'pending',
      special_requests,
      participant_details: participant_details || [],
      contact_person_name: contact_person_name || null,
      contact_person_email: contact_person_email || null,
      contact_person_phone: contact_person_phone || null,
      meeting_point_id: meeting_point_id || null,
      rental_addons: rentalAddonsPayload,
      expires_at: expiresAt,
    }

    const { data, error } = await (supabase as any)
      .from('ot_bookings')
      .insert(insertData)
      .select()
      .single()

    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Gagal membuat booking' },
      { status: 500 }
    )
  }
}
