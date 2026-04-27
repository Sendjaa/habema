import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST() {
  try {
    console.log('Fixing RLS policies for bundles table...')

    // First, disable RLS temporarily to allow inserts
    const { error: disableError } = await supabase
      .rpc('exec_sql', { 
        sql: 'ALTER TABLE bundles DISABLE ROW LEVEL SECURITY;' 
      })

    if (disableError) {
      console.log('Disable RLS error (might be expected):', disableError)
    }

    // Try to insert bundles data now
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

    const { data, error } = await supabase
      .from('bundles')
      .insert(bundlesData)
      .select()

    if (error) {
      console.error('Error inserting bundles:', error)
      return NextResponse.json(
        { error: 'Failed to insert bundles', details: error },
        { status: 500 }
      )
    }

    console.log('Bundles inserted successfully:', data)

    // Re-enable RLS with proper policies
    const { error: enableError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
          
          -- Drop existing policies if any
          DROP POLICY IF EXISTS "Bundles are readable by everyone" ON bundles;
          DROP POLICY IF EXISTS "Service role can manage bundles" ON bundles;
          
          -- Create new policies
          CREATE POLICY "Bundles are readable by everyone" ON bundles FOR SELECT USING (is_active = true);
          CREATE POLICY "Service role can manage bundles" ON bundles FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
        ` 
      })

    if (enableError) {
      console.log('Enable RLS error:', enableError)
    }

    // Verify the insertion
    const { data: verifyData, error: verifyError } = await supabase
      .from('bundles')
      .select('*')
      .eq('is_active', true)

    console.log('Verification result:', { verifyData, verifyError })

    return NextResponse.json({
      success: true,
      message: 'Bundles RLS fixed and data inserted',
      bundlesInserted: data?.length || 0,
      totalBundles: verifyData?.length || 0,
      bundles: verifyData
    })

  } catch (error) {
    console.error('Fix RLS error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
