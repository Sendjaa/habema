import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('Testing Supabase connection...')
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log('Environment check:', {
      supabaseUrl: supabaseUrl ? 'Set' : 'Not set',
      supabaseAnonKey: supabaseAnonKey ? 'Set' : 'Not set',
      serviceRoleKey: serviceRoleKey ? 'Set' : 'Not set'
    })

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        error: 'Missing Supabase environment variables',
        config: {
          supabaseUrl: supabaseUrl ? 'Set' : 'Missing',
          supabaseAnonKey: supabaseAnonKey ? 'Set' : 'Missing',
          serviceRoleKey: serviceRoleKey ? 'Set' : 'Missing'
        }
      }, { status: 500 })
    }

    // Try to import and test supabase client
    try {
      const { supabase } = await import('@/lib/supabaseClient')
      
      // Test basic connection
      const { data, error } = await supabase
        .from('bundles')
        .select('count')
        .limit(1)

      console.log('Supabase test result:', { data, error })

      return NextResponse.json({
        success: true,
        message: 'Supabase connection test completed',
        config: {
          supabaseUrl: supabaseUrl ? 'Set' : 'Missing',
          supabaseAnonKey: supabaseAnonKey ? 'Set' : 'Missing',
          serviceRoleKey: serviceRoleKey ? 'Set' : 'Missing'
        },
        testResult: { data, error: error?.message }
      })

    } catch (importError) {
      console.error('Supabase import error:', importError)
      return NextResponse.json({
        error: 'Failed to import Supabase client',
        details: importError
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    )
  }
}
