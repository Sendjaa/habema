import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST() {
  try {
    console.log('Setting up database schema and bundles...')

    // First, create the bundles table if it doesn't exist
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS bundles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        target_audience TEXT,
        original_price DECIMAL(10, 2),
        bundle_price DECIMAL(10, 2) NOT NULL,
        discount_percentage DECIMAL(5, 2),
        image_url TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `

    // Execute the table creation
    const { error: tableError } = await supabase.rpc('exec_sql', { sql: createTableSQL })
    
    if (tableError) {
      console.log('Table creation error (might be expected):', tableError)
    }

    // Now insert the bundles data
    const bundlesData = [
      {
        name: 'Open Trip Sunrise',
        bundle_price: 195000,
        description: 'Saksikan matahari terbit dari puncak yang menakjubkan bersama rombongan seru. Keberangkatan setiap akhir pekan.',
        target_audience: 'Open Trip',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        name: 'Open Trip Tracking & Hutan',
        bundle_price: 225000,
        description: 'Jelajahi jalur tracking ke puncak gunung atau lebatnya hutan bersama tim Habema. Cocok untuk solo traveler.',
        target_audience: 'Open Trip',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        name: 'Open Trip Explorer Wisata',
        bundle_price: 275000,
        description: 'Eksplorasi wisata daerah terpilih bersama komunitas satu visi. Perjalanan 3 hari 2 malam penuh kenangan.',
        target_audience: 'Open Trip',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        name: 'Paket Camping Keluarga',
        bundle_price: 700000,
        description: 'Paket sewa alat lengkap untuk keluarga besar. Kami urus semua perlengkapan, kamu fokus menikmati alam.',
        target_audience: 'Camping Keluarga',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        name: 'Paket Camping Komunitas',
        bundle_price: 600000,
        description: 'Ideal untuk kelompok kecil hingga menengah. Nikmati suasana berkemah dengan semua alat siap pakai.',
        target_audience: 'Camping Keluarga',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        name: 'Private Camp Eksklusif',
        bundle_price: 0,
        description: 'Area camping privat untuk organisasi, komunitas, sekolah, atau kampus. Setup eksklusif dengan nuansa alami. Harga custom - hubungi kami.',
        target_audience: 'Private Camp',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        name: 'Campervan Akhir Pekan',
        bundle_price: 1200000,
        description: '3 hari 2 malam petualangan seru dengan campervan. Kebebasan menjelajah daerah wisata pilihan Anda.',
        target_audience: 'Campervan',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        name: 'Campervan Explorer Wisata',
        bundle_price: 0,
        description: 'Jelajahi wisata daerah dan tracking ke puncak gunung atau hutan dengan campervan yang fully equipped. Harga custom - hubungi kami.',
        target_audience: 'Campervan',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]

    // Insert bundles data
    const { data, error } = await supabase
      .from('bundles')
      .upsert(bundlesData)
      .select()

    if (error) {
      console.error('Error inserting bundles:', error)
      return NextResponse.json(
        { error: 'Failed to insert bundles', details: error },
        { status: 500 }
      )
    }

    console.log('Bundles inserted successfully:', data)

    // Verify the insertion
    const { data: verifyData, error: verifyError } = await supabase
      .from('bundles')
      .select('*')
      .eq('is_active', true)

    console.log('Verification result:', { verifyData, verifyError })

    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully',
      bundlesInserted: data?.length || 0,
      totalBundles: verifyData?.length || 0,
      bundles: verifyData
    })

  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
