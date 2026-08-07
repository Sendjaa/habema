import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest) {
  try {
    let supabaseAdmin: any
    try {
      const mod = await import('@/lib/supabaseAdmin')
      supabaseAdmin = mod.supabaseAdmin
    } catch {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    // Fetch pending bookings
    const { data: pending } = await supabaseAdmin
      .from('bookings')
      .select('id, status, total_cost, created_at, user_id')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(20)

    // Fetch picked_up bookings
    const { data: pickedUp } = await supabaseAdmin
      .from('bookings')
      .select('id, status, total_cost, created_at, user_id')
      .eq('status', 'picked_up')
      .order('created_at', { ascending: false })
      .limit(20)

    // Fetch confirmed bookings
    const { data: confirmed } = await supabaseAdmin
      .from('bookings')
      .select('id, status, total_cost, created_at, user_id')
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false })
      .limit(20)

    // Active bookings (pending + confirmed + picked_up) with user info
    const { data: activeBookings } = await supabaseAdmin
      .from('bookings')
      .select(`
        id, status, start_date, end_date, total_cost, created_at, user_id
      `)
      .in('status', ['pending', 'confirmed', 'picked_up'])
      .order('created_at', { ascending: false })
      .limit(20)

    // Fetch user profiles for active bookings
    let userMap: Record<string, any> = {}
    const userIds = [...new Set((activeBookings || []).map((b: any) => b.user_id).filter(Boolean))]
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

    const enrichedActive = (activeBookings || []).map((b: any) => ({
      ...b,
      users: b.user_id ? userMap[b.user_id] || null : null,
    }))

    // Unread notifications count
    const { count: unreadCount } = await supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false)

    return NextResponse.json({
      success: true,
      data: {
        pending: pending || [],
        pickedUp: pickedUp || [],
        confirmed: confirmed || [],
        activeBookings: enrichedActive,
        unreadCount: unreadCount || 0,
      },
    })
  } catch (e: any) {
    console.error('[admin/dashboard] GET error:', e)
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 })
  }
}
