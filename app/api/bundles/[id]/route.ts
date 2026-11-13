import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

// GET /api/bundles/[id] — detail satu paket + komposisi bundle_items (bila ada).
// Dipakai halaman detail paket & booking online paket grup.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Bundle id wajib diisi' }, { status: 400 })
    }

    const { data: bundle, error: bundleError } = await supabase
      .from('bundles')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .maybeSingle()

    if (bundleError) throw new Error(bundleError.message)

    if (!bundle) {
      return NextResponse.json({ error: 'Paket tidak ditemukan' }, { status: 404 })
    }

    // Ambil komposisi paket. Dulu di-bungkus try/catch agar tetap jalan bila
    // tabel bundle_items belum ada di environment lama — sekarang tabelnya
    // bagian dari skema, tapi fallback items=[] tetap dipertahankan bila
    // paket belum punya komposisi.
    const { data: composition, error: compError } = await supabase
      .from('bundle_items')
      .select(`
        quantity,
        equipment:equipment(id, name, price_per_night, image_url)
      `)
      .eq('bundle_id', id)

    if (compError) {
      console.error('[bundles/:id] composition error:', compError.message)
    }

    const items = (composition || [])
      .map((row: any) => ({
        equipment_id: row.equipment?.id,
        name: row.equipment?.name || 'Alat',
        quantity: Number(row.quantity) || 1,
        price_per_night: Number(row.equipment?.price_per_night) || 0,
        image_url: row.equipment?.image_url || null,
      }))
      .filter((r: any) => r.equipment_id)

    const toList = (v: unknown): string[] =>
      Array.isArray(v) ? v.map((x) => String(x)).map((s) => s.trim()).filter(Boolean) : []

    const min = bundle.pax_min ?? null
    const max = bundle.pax_max ?? null
    const paxLabel =
      min != null && max != null ? (min === max ? `Untuk ${min} orang` : `Untuk ${min}–${max} orang`)
      : min != null ? `Untuk ${min}+ orang`
      : null

    // Kolom numeric dari PostgREST bisa berupa number maupun string;
    // normalisasi dulu.
    const bundlePrice = bundle.bundle_price != null ? Number(bundle.bundle_price) : 0
    const originalPrice = bundle.original_price != null ? Number(bundle.original_price) : null
    const discountPercentage =
      bundle.discount_percentage != null ? Number(bundle.discount_percentage) : null

    return NextResponse.json({
      success: true,
      data: {
        id: bundle.id,
        name: bundle.name,
        description: bundle.description,
        category: bundle.target_audience || 'General',
        bundle_price: bundlePrice,
        original_price: originalPrice,
        discount_percentage: discountPercentage,
        image_url: bundle.image_url,
        paxMin: min,
        paxMax: max,
        paxLabel,
        // harga paket bersifat per paket per malam untuk kategori grup
        pricePerNight: bundlePrice,
        unit: bundle.target_audience === 'Paket Rental Grup' ? '/ paket/malam' : '',
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
