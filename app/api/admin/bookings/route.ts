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
    const userTypeFilter = searchParams.get('userType') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const itemsPerPage = parseInt(searchParams.get('perPage') || '10')

    let query = supabaseAdmin.from('bookings').select('*', { count: 'exact' })

    if (searchTerm) {
      query = query.or(`id.ilike.%${searchTerm}%`)
    }
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }
    if (userTypeFilter === 'anonymous') {
      query = query.is('user_id', null)
    } else if (userTypeFilter === 'registered') {
      query = query.not('user_id', 'is', null)
    }

    const from = (page - 1) * itemsPerPage
    const to = from + itemsPerPage - 1

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch user profiles for bookings with user_id
    let userMap: Record<string, any> = {}
    const userIds = [...new Set((data || []).map((b: any) => b.user_id).filter(Boolean))]
    if (userIds.length > 0) {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, email, full_name')
        .in('id', userIds)
      if (users) {
        for (const u of users) {
          userMap[u.id] = u
        }
      }
    }

    // Fetch booking_items for all bookings in this page
    const bookingIds = (data || []).map((b: any) => b.id)
    let itemsByBooking: Record<string, any[]> = {}
    if (bookingIds.length > 0) {
      const { data: items } = await supabaseAdmin
        .from('booking_items')
        .select('*, equipment!inner(id, name, image_url)')
        .in('booking_id', bookingIds)
      if (items) {
        for (const item of items) {
          if (!itemsByBooking[item.booking_id]) {
            itemsByBooking[item.booking_id] = []
          }
          itemsByBooking[item.booking_id].push(item)
        }
      }
    }

    const enrichedData = (data || []).map((b: any) => ({
      ...b,
      user_profile: b.user_id ? userMap[b.user_id] || null : null,
      booking_items: itemsByBooking[b.id] || [],
    }))

    return NextResponse.json({
      success: true,
      data: enrichedData,
      count: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / itemsPerPage),
    })
  } catch (error) {
    console.error('Admin bookings API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
