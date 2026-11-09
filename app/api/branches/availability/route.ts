import { NextRequest, NextResponse } from 'next/server'
import { and, asc, eq, gte, inArray, lte } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import {
  bookingItems,
  bookings,
  branchInventory,
  branches,
  bundleItems,
} from '@/lib/db/schema'

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

// Bentuk cabang snake_case seperti embed PostgREST
// `branch:branches(id, name, ...)` — pemanggil mengharapkan kunci ini.
function toLegacyBranch(b: typeof branches.$inferSelect) {
  return {
    id: b.id,
    name: b.name,
    address: b.address,
    city: b.city,
    phone: b.phone,
    operational_hours: b.operationalHours,
    map_url: b.mapUrl,
    is_active: b.isActive,
  }
}

const ACTIVE_BOOKING_STATUS = ['pending', 'confirmed', 'picked_up', 'active']

export async function GET(request: NextRequest) {
  let db: ReturnType<typeof getDb>
  try {
    db = getDb()
  } catch (e: any) {
    console.error('Database init failed:', e.message)
    return NextResponse.json(
      { error: 'Database not configured. Set POSTGRES_URL in .env.local' },
      { status: 503 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const bundleId = searchParams.get('bundleId')
    const bundleQty = Math.max(1, Number(searchParams.get('bundleQty')) || 1)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // ===== Mode paket grup =====
    if (bundleId && !productId) {
      // Dulu `bundle_items.select('quantity, equipment_id').eq('bundle_id', ...)`.
      const composition = await db.query.bundleItems.findMany({
        columns: { equipmentId: true, quantity: true },
        where: eq(bundleItems.bundleId, bundleId),
      })

      // Belum ada komposisi: kembalikan semua cabang aktif (tanpa batas stok rinci).
      if (!composition || composition.length === 0) {
        const allBranches = await db
          .select()
          .from(branches)
          .where(eq(branches.isActive, true))
          .orderBy(asc(branches.createdAt))
        const list = (allBranches || []).map((b) => ({
          ...toLegacyBranch(b),
          stock: 999,
          packageStock: 999,
          hasStockLink: false,
        }))
        return NextResponse.json({ success: true, data: list })
      }

      const equipmentIds = composition.map((c) => String(c.equipmentId))
      const needPerPackage = new Map<string, number>(
        composition.map((c) => [String(c.equipmentId), Math.max(1, Number(c.quantity) || 1)]),
      )

      // Dulu `branch_inventory.select('branch_id, equipment_id, quantity,
      // branch:branches(...)').in('equipment_id', equipmentIds)`.
      const invRows = await db.query.branchInventory.findMany({
        with: { branch: true },
        where: inArray(branchInventory.equipmentId, equipmentIds),
      })

      // Kelompokkan stok per cabang.
      const perBranch = new Map<string, { branch: ReturnType<typeof toLegacyBranch>; stockByEq: Map<string, number> }>()
      for (const row of invRows || []) {
        if (!row.branch || row.branch.isActive === false) continue
        const bid = String(row.branchId)
        if (!perBranch.has(bid)) {
          perBranch.set(bid, { branch: toLegacyBranch(row.branch), stockByEq: new Map() })
        }
        perBranch.get(bid)!.stockByEq.set(String(row.equipmentId), Number(row.quantity) || 0)
      }

      // Kurangi yang terkunci bila tanggal diberikan.
      const locked = new Map<string, Map<string, number>>() // branch -> eq -> qty
      if (startDate && endDate) {
        // Dulu `booking_items.select('quantity, equipment_id,
        // bookings!inner(...)').in('equipment_id', ...).in('bookings.status', ...)
        // .lte('bookings.start_date', endDate).gte('bookings.end_date', startDate)`.
        const overlapping = await db
          .select({
            quantity: bookingItems.quantity,
            equipmentId: bookingItems.equipmentId,
            pickupBranchId: bookings.pickupBranchId,
          })
          .from(bookingItems)
          .innerJoin(bookings, eq(bookingItems.bookingId, bookings.id))
          .where(
            and(
              inArray(bookingItems.equipmentId, equipmentIds),
              inArray(bookings.status, ACTIVE_BOOKING_STATUS),
              lte(bookings.startDate, new Date(endDate)),
              gte(bookings.endDate, new Date(startDate)),
            ),
          )
        for (const row of overlapping || []) {
          const bid = String(row.pickupBranchId || '')
          if (!bid) continue
          if (!locked.has(bid)) locked.set(bid, new Map())
          const m = locked.get(bid)!
          m.set(String(row.equipmentId), (m.get(String(row.equipmentId)) || 0) + Number(row.quantity || 0))
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

    // Dulu `branch_inventory.select('quantity, branch:branches(...)')`
    // + opsional `.eq('equipment_id', productId)`.
    const invRows = await db.query.branchInventory.findMany({
      with: { branch: true },
      where: productId ? eq(branchInventory.equipmentId, productId) : undefined,
    })

    const availability = (invRows || [])
      .filter((row) => row.branch && row.branch.isActive !== false)
      .map((row) => ({ ...toLegacyBranch(row.branch!), stock: Number(row.quantity) || 0 }))

    // Jika tanggal diberikan, kurangi stok dengan unit yang sudah terkunci
    if (startDate && endDate && productId) {
      // Ambil semua booking aktif yang menyewa produk ini di tiap cabang
      // pada rentang tanggal yang overlap
      const overlappingBookings = await db
        .select({
          quantity: bookingItems.quantity,
          pickupBranchId: bookings.pickupBranchId,
        })
        .from(bookingItems)
        .innerJoin(bookings, eq(bookingItems.bookingId, bookings.id))
        .where(
          and(
            eq(bookingItems.equipmentId, productId),
            inArray(bookings.status, ACTIVE_BOOKING_STATUS),
            lte(bookings.startDate, new Date(endDate)),
            gte(bookings.endDate, new Date(startDate)),
          ),
        )

      // Hitung total terkunci per branch
      const lockedPerBranch = new Map<string, number>()
      if (overlappingBookings) {
        for (const row of overlappingBookings) {
          const branchId = row.pickupBranchId
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
    return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 })
  }
}
