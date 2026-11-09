import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

async function getAdmin() {
  try {
    const mod = await import('@/lib/supabaseAdmin')
    return mod.supabaseAdmin
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const supabaseAdmin = await getAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Database not configured' }, { status: 503 })

  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('mode') || 'list'

  try {
    // ── Stats ──────────────────────────────────────────────────
    if (mode === 'stats') {
      const { count: totalUsers } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { count: activeUsers } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('last_sign_in_at', thirtyDaysAgo.toISOString())

      const firstDayOfMonth = new Date()
      firstDayOfMonth.setDate(1)
      firstDayOfMonth.setHours(0, 0, 0, 0)

      const { count: newUsersThisMonth } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstDayOfMonth.toISOString())

      const { data: allBookings } = await supabaseAdmin
        .from('bookings')
        .select('total_cost')
        .not('user_id', 'is', null)

      const totalBookings = allBookings?.length || 0
      const totalRevenue = (allBookings || []).reduce(
        (sum, b: any) => sum + (b.total_cost || 0),
        0
      )

      return NextResponse.json({
        success: true,
        data: {
          totalUsers: totalUsers || 0,
          activeUsers: activeUsers || 0,
          newUsersThisMonth: newUsersThisMonth || 0,
          totalBookings,
          totalRevenue,
        },
      })
    }

    // ── Export CSV ─────────────────────────────────────────────
    if (mode === 'export') {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('email, full_name, phone, created_at, last_sign_in_at')
        .order('created_at', { ascending: false })

      if (error) throw error
      return NextResponse.json({ success: true, data })
    }

    // ── List (search + date filter + pagination) ───────────────
    const searchTerm = searchParams.get('search') || ''
    const dateFilter = searchParams.get('date') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const itemsPerPage = parseInt(searchParams.get('perPage') || '10')

    let query = supabaseAdmin.from('users').select('*', { count: 'exact' })

    if (searchTerm) {
      query = query.or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
    }

    if (dateFilter === 'today') {
      const today = new Date().toISOString().split('T')[0]
      query = query.gte('created_at', today)
    } else if (dateFilter === 'week') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      query = query.gte('created_at', weekAgo.toISOString())
    } else if (dateFilter === 'month') {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      query = query.gte('created_at', monthAgo.toISOString())
    }

    const from = (page - 1) * itemsPerPage
    const to = from + itemsPerPage - 1

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    // Enrich each user with booking count + total spent (single query)
    const userIds = (data || []).map((u: any) => u.id).filter(Boolean)
    let bookingStats: Record<string, { booking_count: number; total_spent: number }> = {}

    if (userIds.length > 0) {
      const { data: bookings } = await supabaseAdmin
        .from('bookings')
        .select('user_id, total_cost')
        .in('user_id', userIds)

      for (const b of bookings || []) {
        const uid = (b as any).user_id
        if (!uid) continue
        if (!bookingStats[uid]) {
          bookingStats[uid] = { booking_count: 0, total_spent: 0 }
        }
        bookingStats[uid].booking_count += 1
        bookingStats[uid].total_spent += (b as any).total_cost || 0
      }
    }

    const enriched = (data || []).map((user: any) => ({
      ...user,
      booking_count: bookingStats[user.id]?.booking_count || 0,
      total_spent: bookingStats[user.id]?.total_spent || 0,
    }))

    return NextResponse.json({
      success: true,
      data: enriched,
      count: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / itemsPerPage),
    })
  } catch (error: any) {
    console.error('Admin users API Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
