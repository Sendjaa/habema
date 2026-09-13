import { NextRequest, NextResponse } from 'next/server'

// GET /api/bundles/[id] — detail satu paket + komposisi bundle_items (bila ada).
// Dipakai halaman detail paket & booking online paket grup.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Bundle id wajib diisi' }, { status: 400 })
    }

    let supabase: any
    try {
      const mod = await import('@/lib/supabaseClient')
      supabase = mod.supabase
    } catch (e: any) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const { data: bundle, error } = await supabase
      .from('bundles')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch bundle' }, { status: 500 })
    }
    if (!bundle) {
      return NextResponse.json({ error: 'Paket tidak ditemukan' }, { status: 404 })
    }

    // Ambil komposisi paket. Bungkus try/catch agar tetap jalan bila tabel
    // bundle_items belum ada di environment lama.
    let items: any[] = []
    try {
      const { data: bundleItems } = await supabase
        .from('bundle_items')
        .select('quantity, equipment:equipment(id, name, price_per_night, image_url)')
        .eq('bundle_id', id)
      items = (bundleItems || []).map((row: any) => ({
        equipment_id: row.equipment?.id,
        name: row.equipment?.name || 'Alat',
        quantity: Number(row.quantity) || 1,
        price_per_night: Number(row.equipment?.price_per_night) || 0,
        image_url: row.equipment?.image_url || null,
      })).filter((r: any) => r.equipment_id)
    } catch {
      items = []
    }

    const toList = (v: unknown): string[] =>
      Array.isArray(v) ? v.map((x) => String(x)).map((s) => s.trim()).filter(Boolean) : []

    const min = bundle.pax_min != null ? Number(bundle.pax_min) : null
    const max = bundle.pax_max != null ? Number(bundle.pax_max) : null
    const paxLabel =
      min != null && max != null ? (min === max ? `Untuk ${min} orang` : `Untuk ${min}–${max} orang`)
      : min != null ? `Untuk ${min}+ orang`
      : null

    return NextResponse.json({
      success: true,
      data: {
        id: bundle.id,
        name: bundle.name,
        description: bundle.description,
        category: bundle.target_audience || 'General',
        bundle_price: Number(bundle.bundle_price) || 0,
        original_price: bundle.original_price != null ? Number(bundle.original_price) : null,
        discount_percentage: bundle.discount_percentage != null ? Number(bundle.discount_percentage) : null,
        image_url: bundle.image_url,
        paxMin: min,
        paxMax: max,
        paxLabel,
        // harga paket bersifat per paket per malam untuk kategori grup
        pricePerNight: Number(bundle.bundle_price) || 0,
        unit: bundle.target_audience === 'Paket Rental Grup' ? '/ paket/malam' : '',
        include: toList(bundle.includes),
        exclude: toList(bundle.excludes),
        items,
        hasStockLink: items.length > 0,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 })
  }
}
