import { NextResponse } from 'next/server'

export async function GET() {
  try {
    let supabase: any
    try {
      const mod = await import('@/lib/supabaseClient')
      supabase = mod.supabase
    } catch (e: any) {
      console.error('Supabase client init failed:', e.message)
      return NextResponse.json(
        { error: 'Database not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local' },
        { status: 503 }
      )
    }

    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('equipment')
      .select(`
        *,
        equipment_categories (
          id,
          name
        )
      `)
      .eq('is_active', true)
      .eq('is_promo', true)
      .lte('promo_start_date', now)
      .gte('promo_end_date', now)
      .order('discount_percentage', { ascending: false, nulls: 'last' })

    if (error) {
      console.error('Error fetching promo products:', error)
      // Kolom promo mungkin belum ada di database — return empty
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
        note: 'promo columns may not exist yet',
      })
    }

    const promos = (data || []).map((item: any) => {
      const originalPrice = Number(item.price_per_night) || 0
      const discountPct = Number(item.discount_percentage) || 0
      const promoPrice = item.promo_price_per_night != null
        ? Number(item.promo_price_per_night)
        : discountPct > 0
          ? Math.round(originalPrice * (1 - discountPct / 100))
          : originalPrice

      return {
        ...item,
        original_price_per_night: originalPrice,
        promo_price_per_night: promoPrice,
        discount_percentage: discountPct,
      }
    })

    return NextResponse.json({
      success: true,
      data: promos,
      count: promos.length,
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}