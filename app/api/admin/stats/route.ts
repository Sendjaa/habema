import { NextResponse } from 'next/server'

export async function GET() {
  try {
    let supabaseAdmin: any
    try {
      const mod = await import('@/lib/supabaseAdmin')
      supabaseAdmin = mod.supabaseAdmin
    } catch (e: any) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    let totalBookings = 0
    let pendingBookings = 0
    let confirmedBookings = 0
    let totalRevenue = 0
    let monthlyRevenue = 0
    let totalUsers = 0
    let newUsersThisMonth = 0
    let totalEquipment = 0
    let lowStockItems = 0

    // Bookings
    const { data: bookings } = await supabaseAdmin
      .from('bookings')
      .select('id, status, total_cost, created_at')

    if (bookings) {
      totalBookings = bookings.length
      pendingBookings = bookings.filter((b: any) => b.status === 'pending').length
      confirmedBookings = bookings.filter((b: any) => b.status === 'confirmed').length
      totalRevenue = bookings.reduce((sum: number, b: any) => sum + (b.total_cost || 0), 0)

      const firstDay = new Date()
      firstDay.setDate(1)
      firstDay.setHours(0, 0, 0, 0)
      monthlyRevenue = bookings
        .filter((b: any) => b.created_at && new Date(b.created_at) >= firstDay)
        .reduce((sum: number, b: any) => sum + (b.total_cost || 0), 0)
    }

    // Users
    const { count: usersCount } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
    totalUsers = usersCount || 0

    const firstDay = new Date()
    firstDay.setDate(1)
    firstDay.setHours(0, 0, 0, 0)
    const { count: newUsersCount } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', firstDay.toISOString())
    newUsersThisMonth = newUsersCount || 0

    // Equipment
    const { data: equipment } = await supabaseAdmin
      .from('equipment')
      .select('id, stock_quantity')

    if (equipment) {
      totalEquipment = equipment.length
      lowStockItems = equipment.filter((e: any) => (e.stock_quantity || 0) <= 3).length
    }

    let recentBookings: any[] = []
    if (bookings) {
      recentBookings = bookings
        .filter((b: any) => b.created_at)
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map((b: any) => ({ id: b.id, status: b.status, total_cost: b.total_cost, created_at: b.created_at }))
    }

    return NextResponse.json({
      success: true,
      data: {
        totalBookings,
        pendingBookings,
        confirmedBookings,
        totalRevenue,
        monthlyRevenue,
        totalUsers,
        newUsersThisMonth,
        totalEquipment,
        lowStockItems,
        recentBookings,
      },
    })
  } catch (error) {
    console.error('Admin stats API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
