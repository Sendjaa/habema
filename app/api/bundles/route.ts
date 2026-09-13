import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Lazy import supabase – handle missing env gracefully
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

    // Fetch all active bundles from database
    console.log('Fetching bundles from database...')
    const { data: bundles, error } = await supabase
      .from('bundles')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    console.log('Bundles query result:', { bundles, error })
    console.log('Number of bundles found:', bundles?.length || 0)

    if (error) {
      console.error('Error fetching bundles:', error)
      return NextResponse.json(
        { error: 'Failed to fetch bundles' },
        { status: 500 }
      )
    }

    // Transform database data to match frontend Package type
    const transformedBundles = bundles?.map((bundle: any) => {
      // Generate accent colors based on target_audience
      const getAccentColors = (targetAudience: string) => {
        const colorMap = {
          'Open Trip': { accent: '#d97706', accentLight: '#fef3c7' },
          'Camping Keluarga': { accent: '#16a34a', accentLight: '#dcfce7' },
          'Private Camp': { accent: '#0284c7', accentLight: '#e0f2fe' },
          'Campervan': { accent: '#dc2626', accentLight: '#fee2e2' },
          'Paket Rental Grup': { accent: '#0f766e', accentLight: '#ccfbf1' }
        }
        return colorMap[targetAudience as keyof typeof colorMap] || { accent: '#6b7280', accentLight: '#f3f4f6' }
      }

      // Generate badge based on name/description
      const getBadge = (name: string, description: string) => {
        if (name.includes('Sunrise')) return 'Terlaris'
        if (name.includes('Tracking')) return 'Petualangan'
        if (name.includes('Camping Keluarga')) return 'Rekomendasi'
        if (name.includes('Private Camp')) return 'Komunitas / Sekolah'
        if (name.includes('Campervan Akhir Pekan')) return '10% Diskon – 5 Pertama'
        if (name.includes('Berdua')) return 'Favorit Couple'
        if (name.includes('Berempat')) return 'Terlaris'
        if (name.includes('6-7')) return 'Hemat Grup'
        if (name.includes('10 Orang')) return 'Maksimal Hemat'
        return null
      }

      // Format price
      const formatPrice = (price: number | null) => {
        if (price === null || price === 0) return null
        return price.toLocaleString('id-ID')
      }

      // Format original price
      const formatOriginalPrice = (originalPrice: number | null, bundlePrice: number) => {
        if (originalPrice === null || originalPrice === 0) return null
        return originalPrice.toLocaleString('id-ID')
      }

      // Generate unit based on target audience
      // Paket Rental Grup: harga per paket per malam (dikalikan durasi saat booking).
      const getUnit = (targetAudience: string, price: number) => {
        if (targetAudience === 'Open Trip') return '/ orang'
        if (targetAudience === 'Camping Keluarga') {
          if (price === 600000) return '/ 10 orang'
          return '/ 15 orang'
        }
        if (targetAudience === 'Campervan') return '/ paket'
        if (targetAudience === 'Paket Rental Grup') return '/ paket/malam'
        return ''
      }

      const getPaxLabel = (bundle: any): string | null => {
        const min = bundle.pax_min != null ? Number(bundle.pax_min) : null
        const max = bundle.pax_max != null ? Number(bundle.pax_max) : null
        if (min != null && max != null && Number.isFinite(min) && Number.isFinite(max)) {
          if (min === max) return `Untuk ${min} orang`
          return `Untuk ${min}–${max} orang`
        }
        if (min != null && Number.isFinite(min)) return `Untuk ${min}+ orang`
        return null
      }

      const colors = getAccentColors(bundle.target_audience)

      // includes/excludes dikelola dari admin; normalisasi ke string[].
      const toList = (v: unknown): string[] =>
        Array.isArray(v) ? v.map((x) => String(x)).map((s) => s.trim()).filter(Boolean) : []

      return {
        id: bundle.id,
        category: bundle.target_audience || 'General',
        label: bundle.name,
        badge: getBadge(bundle.name, bundle.description),
        price: formatPrice(bundle.bundle_price),
        priceRaw: bundle.bundle_price,
        priceOld: formatOriginalPrice(bundle.original_price, bundle.bundle_price),
        unit: getUnit(bundle.target_audience, bundle.bundle_price),
        paxMin: bundle.pax_min ?? null,
        paxMax: bundle.pax_max ?? null,
        paxLabel: getPaxLabel(bundle),
        bookableOnline: true,
        desc: bundle.description,
        image: bundle.image_url || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
        include: toList(bundle.includes),
        exclude: toList(bundle.excludes),
        accent: colors.accent,
        accentLight: colors.accentLight,
      }
    }) || []

    return NextResponse.json({
      success: true,
      data: transformedBundles
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
