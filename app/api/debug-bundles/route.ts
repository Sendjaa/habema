import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET() {
  try {
    console.log('Debug: Testing database connection...')

    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')
      .eq('tablename', 'bundles')

    console.log('Table existence test:', { testData, testError })

    // Try to create table using raw SQL if it doesn't exist
    if (!testData || testData.length === 0) {
      console.log('Table does not exist, attempting to create...')
      
      // Using the raw SQL approach - but this might not work without proper permissions
      const createSQL = `
        CREATE TABLE bundles (
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

      // Try using supabase.sql() if available, or skip table creation
      console.log('SQL to execute:', createSQL)
    }

    // Try a simple insert to see what happens
    const { data: insertData, error: insertError } = await supabase
      .from('bundles')
      .insert({
        name: 'Test Bundle',
        bundle_price: 100000,
        description: 'Test description',
        target_audience: 'Test',
        is_active: true
      })
      .select()

    console.log('Insert test result:', { insertData, insertError })

    // Try to select all bundles
    const { data: selectData, error: selectError } = await supabase
      .from('bundles')
      .select('*')

    console.log('Select test result:', { selectData, selectError })

    return NextResponse.json({
      success: true,
      tableExists: testData && testData.length > 0,
      insertResult: insertData,
      selectResult: selectData,
      errors: {
        test: testError?.message,
        insert: insertError?.message,
        select: selectError?.message
      }
    })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    )
  }
}
