import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST() {
  try {
    console.log('Seeding bundles data...')

    // Simple test data first
    const testBundle = {
      name: 'Open Trip Sunrise',
      bundle_price: 195000,
      description: 'Saksikan matahari terbit dari puncak yang menakjubkan bersama rombongan seru.',
      target_audience: 'Open Trip',
      is_active: true
    }

    // Try to insert one bundle first
    const { data, error } = await supabase
      .from('bundles')
      .insert(testBundle)
      .select()

    if (error) {
      console.error('Error inserting test bundle:', error)
      
      // If RLS error, try using service role
      if (error.message?.includes('row-level security')) {
        console.log('RLS error detected, trying with service role...')
        
        // Import supabaseAdmin dynamically to avoid import issues
        const { supabaseAdmin } = await import('@/lib/supabaseAdmin')
        
        const { data: adminData, error: adminError } = await supabaseAdmin
          .from('bundles')
          .insert(testBundle)
          .select()

        if (adminError) {
          console.error('Admin insert error:', adminError)
          return NextResponse.json(
            { error: 'Failed to insert with admin client', details: adminError },
            { status: 500 }
          )
        }

        console.log('Admin insert successful:', adminData)
        
        return NextResponse.json({
          success: true,
          message: 'Bundle inserted with admin client',
          bundle: adminData
        })
      }

      return NextResponse.json(
        { error: 'Failed to insert bundle', details: error },
        { status: 500 }
      )
    }

    console.log('Bundle inserted successfully:', data)

    return NextResponse.json({
      success: true,
      message: 'Bundle inserted successfully',
      bundle: data
    })

  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
