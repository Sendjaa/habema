import { NextRequest, NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { bundleItems, bundles } from '@/lib/db/schema'

// GET /api/bundles/[id] — detail satu paket + komposisi bundle_items (bila ada).
// Dipakai halaman detail paket & booking online paket grup.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let db: ReturnType<typeof getDb>
  try {
    db = getDb()
  } catch (e: any) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Bundle id wajib diisi' }, { status: 400 })
    }

    // Dulu `supabase.from('bundles').select('*').eq('id', id)
    // .eq('is_active', true).maybeSingle()`.
    const bundle = await db.query.bundles.findFirst({
      where: and(eq(bundles.id, id), eq(bundles.isActive, true)),
    })

    if (!bundle) {
      return NextResponse.json({ error: 'Paket tidak ditemukan' }, { status: 404 })
    }

    // Ambil komposisi paket. Dulu di-bungkus try/catch agar tetap jalan bila
    // tabel bundle_items belum ada di environment lama — sekarang tabelnya
    // bagian dari skema, tapi fallback items=[] tetap dipertahankan bila
    // paket belum punya komposisi.
    // Dulu `bundle_items.select('quantity, equipment:equipment(id, name,
    // price_per_night, image_url)').eq('bundle_id', id)`.
    const composition = await db.query.bundleItems.findMany({
      columns: { quantity: true },
      with: {
        equipment: {
          columns: { id: true, name: true, pricePerNight: true, imageUrl: true },
        },
      },
      where: eq(bundleItems.bundleId, id),
    })
    const items = (composition || [])
      .map((row) => ({
        equipment_id: row.equipment?.id,
        name: row.equipment?.name || 'Alat',
        quantity: Number(row.quantity) || 1,
        price_per_night: Number(row.equipment?.pricePerNight) || 0,
        image_url: row.equipment?.imageUrl || null,
      }))
      .filter((r) => r.equipment_id)

    const toList = (v: unknown): string[] =>
      Array.isArray(v) ? v.map((x) => String(x)).map((s) => s.trim()).filter(Boolean) : []

    const min = bundle.paxMin ?? null
    const max = bundle.paxMax ?? null
    const paxLabel =
      min != null && max != null ? (min === max ? `Untuk ${min} orang` : `Untuk ${min}–${max} orang`)
      : min != null ? `Untuk ${min}+ orang`
      : null

    // Kolom numeric datang dari driver pg sebagai STRING — normalisasi dulu.
    const bundlePrice = bundle.bundlePrice != null ? Number(bundle.bundlePrice) : 0
    const originalPrice = bundle.originalPrice != null ? Number(bundle.originalPrice) : null
    const discountPercentage =
      bundle.discountPercentage != null ? Number(bundle.discountPercentage) : null

    return NextResponse.json({
      success: true,
      data: {
        id: bundle.id,
        name: bundle.name,
        description: bundle.description,
        category: bundle.targetAudience || 'General',
        bundle_price: bundlePrice,
        original_price: originalPrice,
        discount_percentage: discountPercentage,
        image_url: bundle.imageUrl,
        paxMin: min,
        paxMax: max,
        paxLabel,
        // harga paket bersifat per paket per malam untuk kategori grup
        pricePerNight: bundlePrice,
        unit: bundle.targetAudience === 'Paket Rental Grup' ? '/ paket/malam' : '',
        include: toList(bundle.includes),
        exclude: toList(bundle.excludes),
        items,
        hasStockLink: items.length > 0,
      },
    })
  } catch (e: any) {
    console.error('[bundles/:id] GET error:', e)
    return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 })
  }
}
