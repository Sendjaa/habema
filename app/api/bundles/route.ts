import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('bundles')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    console.log('Number of bundles found:', data?.length ?? 0)

    // Transform database data to match frontend Package type
    const transformedBundles = (data || []).map((bundle: any) => {
      // Generate accent colors based on target_audience
      const getAccentColors = (targetAudience: string | null) => {
        // Hanya tiga keluarga warna: forest, gold, stone.
        const colorMap = {
          'Open Trip': { accent: '#0f766e', accentLight: '#f0fdfa' },
          'Camping Keluarga': { accent: '#115e59', accentLight: '#ccfbf1' },
          'Private Camp': { accent: '#0f766e', accentLight: '#f0fdfa' },
          'Campervan': { accent: '#f97316', accentLight: '#ffedd5' },
          'Paket Rental Grup': { accent: '#115e59', accentLight: '#ccfbf1' }
        }
        return colorMap[targetAudience as keyof typeof colorMap] || { accent: '#64748b', accentLight: '#f1f5f9' }
      }

      // Generate badge based on name/description
      const getBadge = (name: string | null) => {
        if (!name) return null
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
      const formatOriginalPrice = (originalPrice: number | null) => {
        if (originalPrice === null || originalPrice === 0) return null
        return originalPrice.toLocaleString('id-ID')
      }

      // Generate unit based on target audience
      // Paket Rental Grup: harga per paket per malam (dikalikan durasi saat booking).
      const getUnit = (targetAudience: string | null, price: number) => {
        if (targetAudience === 'Open Trip') return '/ orang'
        if (targetAudience === 'Camping Keluarga') {
          if (price === 600000) return '/ 10 orang'
          return '/ 15 orang'
        }
        if (targetAudience === 'Campervan') return '/ paket'
        if (targetAudience === 'Paket Rental Grup') return '/ paket/malam'
        return ''
      }

      const getPaxLabel = (min: number | null, max: number | null): string | null => {
        if (min != null && max != null && Number.isFinite(min) && Number.isFinite(max)) {
          if (min === max) return `Untuk ${min} orang`
          return `Untuk ${min}–${max} orang`
        }
        if (min != null && Number.isFinite(min)) return `Untuk ${min}+ orang`
        return null
      }

      // Kolom numeric dari PostgREST bisa berupa number maupun string;
      // normalisasi dulu supaya perbandingan (`price === 600000`) dan
      // toLocaleString tetap benar.
      const bundlePrice = bundle.bundle_price != null ? Number(bundle.bundle_price) : 0
      const originalPrice = bundle.original_price != null ? Number(bundle.original_price) : null
      const colors = getAccentColors(bundle.target_audience)

      // includes/excludes dikelola dari admin; normalisasi ke string[].
      const toList = (v: unknown): string[] =>
        Array.isArray(v) ? v.map((x) => String(x)).map((s) => s.trim()).filter(Boolean) : []

      return {
        id: bundle.id,
        category: bundle.target_audience || 'General',
        label: bundle.name,
        badge: getBadge(bundle.name),
        price: formatPrice(bundlePrice || null),
        priceRaw: bundle.bundle_price != null ? bundlePrice : null,
        priceOld: formatOriginalPrice(originalPrice),
        unit: getUnit(bundle.target_audience, bundlePrice),
        paxMin: bundle.pax_min ?? null,
        paxMax: bundle.pax_max ?? null,
        paxLabel: getPaxLabel(bundle.pax_min, bundle.pax_max),
        bookableOnline: true,
        desc: bundle.description,
        image: bundle.image_url || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
        include: toList(bundle.includes),
        exclude: toList(bundle.excludes),
        accent: colors.accent,
        accentLight: colors.accentLight,
      }
    })

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
