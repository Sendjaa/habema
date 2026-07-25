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

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    firstDay.setHours(0, 0, 0, 0)

    // Bookings
    const { data: bookings } = await supabaseAdmin
      .from('bookings')
      .select('id, status, total_cost, created_at')

    if (bookings) {
      totalBookings = bookings.length
      pendingBookings = bookings.filter((b: any) => b.status === 'pending').length
      confirmedBookings = bookings.filter((b: any) => b.status === 'confirmed').length
      totalRevenue = bookings.reduce((sum: number, b: any) => sum + (b.total_cost || 0), 0)

      monthlyRevenue = bookings
        .filter((b: any) => b.created_at && new Date(b.created_at) >= firstDay)
        .reduce((sum: number, b: any) => sum + (b.total_cost || 0), 0)
    }

    // Revenue by status
    const revenueByStatus: Record<string, number> = {
      pending: 0, confirmed: 0, picked_up: 0, returned: 0, cancelled: 0,
    }
    if (bookings) {
      for (const b of bookings) {
        const status = b.status || 'pending'
        revenueByStatus[status] = (revenueByStatus[status] || 0) + (b.total_cost || 0)
      }
    }

    // Daily revenue for current month
    const dailyRevenueMap: Record<string, number> = {}
    if (bookings) {
      for (const b of bookings) {
        if (b.created_at) {
          const d = new Date(b.created_at)
          if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
            const dateKey = b.created_at.split('T')[0]
            dailyRevenueMap[dateKey] = (dailyRevenueMap[dateKey] || 0) + (b.total_cost || 0)
          }
        }
      }
    }
    const dailyRevenue = Object.entries(dailyRevenueMap)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Monthly trend (last 6 months including current)
    const months: string[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      months.push(key)
    }
    const monthlyRevenueMap: Record<string, number> = {}
    if (bookings) {
      for (const b of bookings) {
        if (b.created_at) {
          const key = b.created_at.substring(0, 7)
          if (months.includes(key)) {
            monthlyRevenueMap[key] = (monthlyRevenueMap[key] || 0) + (b.total_cost || 0)
          }
        }
      }
    }
    const monthlyRevenueTrend = months.map(month => ({
      month,
      revenue: monthlyRevenueMap[month] || 0,
    }))

    // Revenue by category
    const { data: bookingItems } = await supabaseAdmin
      .from('booking_items')
      .select('subtotal, equipment_id')

    const revenueByCategory: { category_name: string; revenue: number }[] = []
    if (bookingItems && bookingItems.length > 0) {
      const equipmentIds = [...new Set(bookingItems.map((i: any) => i.equipment_id))]
      const [equipmentRes, categoriesRes] = await Promise.all([
        supabaseAdmin.from('equipment').select('id, category_id').in('id', equipmentIds),
        supabaseAdmin.from('equipment_categories').select('id, name'),
      ])

      const categoryMap = new Map<string, string>()
      if (categoriesRes.data) {
        for (const c of categoriesRes.data) {
          categoryMap.set(c.id, c.name)
        }
      }

      const equipmentCategoryMap = new Map<string, string>()
      if (equipmentRes.data) {
        for (const e of equipmentRes.data) {
          equipmentCategoryMap.set(e.id, e.category_id)
        }
      }

      const categoryRevenue = new Map<string, number>()
      for (const item of bookingItems) {
        const catId = equipmentCategoryMap.get(item.equipment_id)
        if (catId) {
          const catName = categoryMap.get(catId) || 'Unknown'
          categoryRevenue.set(catName, (categoryRevenue.get(catName) || 0) + (item.subtotal || 0))
        }
      }

      for (const [name, rev] of categoryRevenue) {
        revenueByCategory.push({ category_name: name, revenue: rev })
      }
      revenueByCategory.sort((a, b) => b.revenue - a.revenue)
    }

    // Users
    const { count: usersCount } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
    totalUsers = usersCount || 0

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
        revenueByStatus,
        dailyRevenue,
        monthlyRevenueTrend,
        revenueByCategory,
      },
    })
  } catch (error) {
    console.error('Admin stats API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
