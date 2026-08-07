import { NextRequest, NextResponse } from 'next/server'

// =====================================================================
// GET /api/branches/availability?productId=<equipment_id>&startDate=<ISO>&endDate=<ISO>
// Kembalikan cabang yang memiliki stok untuk produk tertentu, beserta
// sisa stoknya. Tanpa productId, kembalikan semua cabang dengan stok.
//
// Jika startDate & endDate diberikan, stok dikurangi dengan jumlah unit
// yang sudah terkunci oleh booking aktif (pending/confirmed/picked_up/active)
// pada rentang tanggal tersebut di cabang bersangkutan.
// =====================================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const mod = await import('@/lib/supabaseAdmin')
    const supabaseAdmin = mod.supabaseAdmin

    let query = supabaseAdmin
      .from('branch_inventory')
      .select(`quantity, branch:branches(id, name, address, city, phone, operational_hours, map_url, is_active)`)

    if (productId) {
      query = query.eq('equipment_id', productId)
    }

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const availability = (data || [])
      .filter((row: any) => row.branch?.is_active !== false)
      .map((row: any) => ({ ...row.branch, stock: row.quantity }))

    // Jika tanggal diberikan, kurangi stok dengan unit yang sudah terkunci
    if (startDate && endDate && productId) {
      // Ambil semua booking aktif yang menyewa produk ini di tiap cabang
      // pada rentang tanggal yang overlap
      const { data: overlappingBookings } = await supabaseAdmin
        .from('booking_items')
        .select(`
          quantity,
          booking_id,
          bookings!inner (
            id, status, pickup_branch_id, start_date, end_date
          )
        `)
        .eq('equipment_id', productId)
        .in('bookings.status', ['pending', 'confirmed', 'picked_up', 'active'])
        .lte('bookings.start_date', endDate)
        .gte('bookings.end_date', startDate)

      // Hitung total terkunci per branch
      const lockedPerBranch = new Map<string, number>()
      if (overlappingBookings) {
        for (const row of overlappingBookings as any[]) {
          const branchId = row.bookings?.pickup_branch_id
          if (branchId) {
            lockedPerBranch.set(
              branchId,
              (lockedPerBranch.get(branchId) || 0) + Number(row.quantity)
            )
          }
        }
      }

      // Kurangi stok dengan yang terkunci
      for (const branch of availability) {
        const locked = lockedPerBranch.get(branch.id) || 0
        branch.stock = Math.max(0, branch.stock - locked)
      }
    }

    availability.sort((a: any, b: any) => (b.stock || 0) - (a.stock || 0))

    return NextResponse.json({ success: true, data: availability })
  } catch (e: any) {
    console.error('[branches/availability] GET error:', e)
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 })
  }
}
