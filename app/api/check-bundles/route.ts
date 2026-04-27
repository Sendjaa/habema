import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET() {
  try {
    // Check if table exists and get structure
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'bundles')

    if (tableError) {
      console.log('Error checking table:', tableError)
    }

    // Try to get bundles data regardless
    const { data: bundles, error } = await supabase
      .from('bundles')
      .select('*')
      .limit(5)

    console.log('Bundles check result:', { bundles, error, tableError })

    return NextResponse.json({
      success: true,
      bundlesTableExists: !tableError,
      bundlesCount: bundles?.length || 0,
      bundles: bundles,
      error: error?.message
    })

  } catch (error) {
    console.error('Check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
