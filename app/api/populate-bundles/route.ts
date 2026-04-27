import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST() {
  try {
    console.log('Populating bundles data using admin client...')

    const bundlesData = [
      {
        name: 'Open Trip Sunrise',
        bundle_price: 195000,
        description: 'Saksikan matahari terbit dari puncak yang menakjubkan bersama rombongan seru. Keberangkatan setiap akhir pekan.',
        target_audience: 'Open Trip',
        is_active: true
      },
      {
        name: 'Open Trip Tracking & Hutan',
        bundle_price: 225000,
        description: 'Jelajahi jalur tracking ke puncak gunung atau lebatnya hutan bersama tim Habema. Cocok untuk solo traveler.',
        target_audience: 'Open Trip',
        is_active: true
      },
      {
        name: 'Open Trip Explorer Wisata',
        bundle_price: 275000,
        description: 'Eksplorasi wisata daerah terpilih bersama komunitas satu visi. Perjalanan 3 hari 2 malam penuh kenangan.',
        target_audience: 'Open Trip',
        is_active: true
      },
      {
        name: 'Paket Camping Keluarga',
        bundle_price: 700000,
        description: 'Paket sewa alat lengkap untuk keluarga besar. Kami urus semua perlengkapan, kamu fokus menikmati alam.',
        target_audience: 'Camping Keluarga',
        is_active: true
      },
      {
        name: 'Paket Camping Komunitas',
        bundle_price: 600000,
        description: 'Ideal untuk kelompok kecil hingga menengah. Nikmati suasana berkemah dengan semua alat siap pakai.',
        target_audience: 'Camping Keluarga',
        is_active: true
      },
      {
        name: 'Private Camp Eksklusif',
        bundle_price: 0,
        description: 'Area camping privat untuk organisasi, komunitas, sekolah, atau kampus. Setup eksklusif dengan nuansa alami. Harga custom - hubungi kami.',
        target_audience: 'Private Camp',
        is_active: true
      },
      {
        name: 'Campervan Akhir Pekan',
        bundle_price: 1200000,
        description: '3 hari 2 malam petualangan seru dengan campervan. Kebebasan menjelajah daerah wisata pilihan Anda.',
        target_audience: 'Campervan',
        is_active: true
      },
      {
        name: 'Campervan Explorer Wisata',
        bundle_price: 0,
        description: 'Jelajahi wisata daerah dan tracking ke puncak gunung atau hutan dengan campervan yang fully equipped. Harga custom - hubungi kami.',
        target_audience: 'Campervan',
        is_active: true
      }
    ]

    // Insert bundles using admin client (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('bundles')
      .upsert(bundlesData as any, { onConflict: 'name' })
      .select()

    if (error) {
      console.error('Error inserting bundles with admin:', error)
      return NextResponse.json(
        { error: 'Failed to insert bundles', details: error },
        { status: 500 }
      )
    }

    console.log('Bundles inserted successfully with admin:', data)

    // Verify the insertion
    const { data: verifyData, error: verifyError } = await supabaseAdmin
      .from('bundles')
      .select('*')
      .eq('is_active', true)

    console.log('Verification result:', { verifyData, verifyError })

    return NextResponse.json({
      success: true,
      message: 'Bundles populated successfully using admin client',
      bundlesInserted: data?.length || 0,
      totalBundles: verifyData?.length || 0,
      bundles: verifyData
    })

  } catch (error) {
    console.error('Populate bundles error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
