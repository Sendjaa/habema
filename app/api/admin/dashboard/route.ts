import { NextResponse } from 'next/server'

export async function GET() {
  try {
    let supabaseAdmin: any
    try {
      const mod = await import('@/lib/supabaseAdmin')
      supabaseAdmin = mod.supabaseAdmin
    } catch (e: any) {
      console.error('Import error:', e?.message)
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Koneksi database gagal (supabaseAdmin null)' }, { status: 500 })
    }

    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(startOfDay)
    endOfDay.setDate(endOfDay.getDate() + 1)

    // Today's bookings for stat cards
    const { data: todayBookings, error } = await supabaseAdmin
      .from('bookings')
      .select('id, status, total_cost, created_at, user_id')
      .in('status', ['pending', 'confirmed', 'picked_up'])
      .gte('created_at', startOfDay.toISOString())
      .lt('created_at', endOfDay.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Query1 error:', error)
      throw error
    }

    // All active bookings for user list
    const { data: activeBookings, error: activeError } = await supabaseAdmin
      .from('bookings')
      .select('id, status, start_date, end_date, total_cost, created_at, user_id')
      .in('status', ['pending', 'confirmed', 'picked_up'])
      .order('created_at', { ascending: false })

    if (activeError) {
      console.error('Query2 error:', activeError)
      throw activeError
    }

    // Fetch user profiles for all bookings that have user_id
    const userIds = [...new Set((activeBookings || []).map((b: any) => b.user_id).filter(Boolean))]
    let userMap: Record<string, { id: string; full_name: string | null; email: string | null }> = {}

    if (userIds.length > 0) {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, full_name, email')
        .in('id', userIds)
      if (users) {
        for (const u of users) {
          userMap[u.id] = u
        }
      }
    }

    // Merge user data into bookings
    const enriched = (activeBookings || []).map((b: any) => ({
      ...b,
      users: b.user_id ? (userMap[b.user_id] || null) : null,
    }))

    // Unread notification count
    const { count: unreadCount, error: notifError } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false)
    if (notifError) console.error('Error fetching notification count:', notifError)

    const pending = (todayBookings || []).filter((b: any) => b.status === 'pending')
    const pickedUp = (todayBookings || []).filter((b: any) => b.status === 'picked_up')
    const confirmed = (todayBookings || []).filter((b: any) => b.status === 'confirmed')

    return NextResponse.json({
      success: true,
      data: { pending, pickedUp, confirmed, activeBookings: enriched, unreadCount: unreadCount ?? 0 },
    })
  } catch (error: any) {
    console.error('Dashboard API Error:', error?.message || error, JSON.stringify(error))
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}
