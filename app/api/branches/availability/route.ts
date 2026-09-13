import { NextRequest, NextResponse } from 'next/server'

// =====================================================================
// GET /api/branches/availability?productId=<equipment_id>&startDate=<ISO>&endDate=<ISO>
//     &bundleId=<bundle_id>&bundleQty=<n>
// Kembalikan cabang yang memiliki stok untuk produk tertentu, beserta
// sisa stoknya. Tanpa productId, kembalikan semua cabang dengan stok.
//
// Mode bundleId: hitung berapa PAKET yang bisa dipenuhi per cabang
// (stok paket = min(floor(stok_alat / qty_butuh)) across komposisi).
// Bila paket belum punya komposisi, kembalikan semua cabang aktif tanpa
// angka stok paket (tetap bisa dibooking, tanpa potong stok rinci).
//
// Jika startDate & endDate diberikan, stok dikurangi dengan jumlah unit
// yang sudah terkunci oleh booking aktif (pending/confirmed/picked_up/active)
// pada rentang tanggal tersebut di cabang bersangkutan.
// =====================================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const bundleId = searchParams.get('bundleId')
    const bundleQty = Math.max(1, Number(searchParams.get('bundleQty')) || 1)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const mod = await import('@/lib/supabaseAdmin')
    const supabaseAdmin = mod.supabaseAdmin

    // ===== Mode paket grup =====
    if (bundleId && !productId) {
      const { data: composition } = await supabaseAdmin
        .from('bundle_items')
        .select('quantity, equipment_id')
        .eq('bundle_id', bundleId)

      // Belum ada komposisi: kembalikan semua cabang aktif (tanpa batas stok rinci).
      if (!composition || composition.length === 0) {
        const { data: branches, error: brErr } = await supabaseAdmin
          .from('branches')
          .select('id, name, address, city, phone, operational_hours, map_url, is_active')
          .eq('is_active', true)
        if (brErr) {
          return NextResponse.json({ error: brErr.message }, { status: 500 })
        }
        const list = (branches || []).map((b: any) => ({
          ...b,
          stock: 999,
          packageStock: 999,
          hasStockLink: false,
        }))
        return NextResponse.json({ success: true, data: list })
      }

      const equipmentIds = composition.map((c: any) => c.equipment_id)
      const needPerPackage = new Map<string, number>(
        composition.map((c: any) => [String(c.equipment_id), Math.max(1, Number(c.quantity) || 1)]),
      )

      const { data: invRows, error: invErr } = await supabaseAdmin
        .from('branch_inventory')
        .select('branch_id, equipment_id, quantity, branch:branches(id, name, address, city, phone, operational_hours, map_url, is_active)')
        .in('equipment_id', equipmentIds)
      if (invErr) {
        return NextResponse.json({ error: invErr.message }, { status: 500 })
      }

      // Kelompokkan stok per cabang.
      const perBranch = new Map<string, { branch: any; stockByEq: Map<string, number> }>()
      for (const row of (invRows || []) as any[]) {
        if (row.branch?.is_active === false) continue
        const bid = String(row.branch_id)
        if (!perBranch.has(bid)) {
          perBranch.set(bid, { branch: row.branch, stockByEq: new Map() })
        }
        perBranch.get(bid)!.stockByEq.set(String(row.equipment_id), Number(row.quantity) || 0)
      }

      // Kurangi yang terkunci bila tanggal diberikan.
      let locked = new Map<string, Map<string, number>>() // branch -> eq -> qty
      if (startDate && endDate) {
        const { data: overlapping } = await supabaseAdmin
          .from('booking_items')
          .select('quantity, equipment_id, bookings!inner(id, status, pickup_branch_id, start_date, end_date)')
          .in('equipment_id', equipmentIds)
          .in('bookings.status', ['pending', 'confirmed', 'picked_up', 'active'])
          .lte('bookings.start_date', endDate)
          .gte('bookings.end_date', startDate)
        for (const row of (overlapping || []) as any[]) {
          const bid = String(row.bookings?.pickup_branch_id || '')
          if (!bid) continue
          if (!locked.has(bid)) locked.set(bid, new Map())
          const m = locked.get(bid)!
          m.set(String(row.equipment_id), (m.get(String(row.equipment_id)) || 0) + Number(row.quantity || 0))
        }
      }

      const result: any[] = []
      for (const [bid, entry] of perBranch) {
        let packageStock = Infinity
        let limiting: string | null = null
        for (const eqId of equipmentIds.map(String)) {
          const need = (needPerPackage.get(eqId) || 1) * bundleQty
          const raw = entry.stockByEq.get(eqId) ?? 0
          const lockedQty = locked.get(bid)?.get(eqId) || 0
          const avail = Math.max(0, raw - lockedQty)
          const packs = Math.floor(avail / need)
          if (packs < packageStock) {
            packageStock = packs
            limiting = eqId
          }
        }
        if (!Number.isFinite(packageStock)) packageStock = 0
        result.push({
          ...entry.branch,
          stock: packageStock,
          packageStock,
          hasStockLink: true,
          limitingEquipmentId: limiting,
        })
      }

      result.sort((a, b) => (b.packageStock || 0) - (a.packageStock || 0))
      return NextResponse.json({ success: true, data: result })
    }

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
