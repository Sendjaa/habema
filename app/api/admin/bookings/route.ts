import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    let supabaseAdmin: any
    try {
      const mod = await import('@/lib/supabaseAdmin')
      supabaseAdmin = mod.supabaseAdmin
    } catch {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get('search') || ''
    const statusFilter = searchParams.get('status') || 'all'
    const userTypeFilter = searchParams.get('userType') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const itemsPerPage = parseInt(searchParams.get('perPage') || '10')

    let query = supabaseAdmin.from('bookings').select('*', { count: 'exact' })

    if (searchTerm) {
      query = query.or(`id.ilike.%${searchTerm}%`)
    }
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }
    if (userTypeFilter === 'anonymous') {
      query = query.is('user_id', null)
    } else if (userTypeFilter === 'registered') {
      query = query.not('user_id', 'is', null)
    }

    const from = (page - 1) * itemsPerPage
    const to = from + itemsPerPage - 1

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / itemsPerPage),
    })
  } catch (error) {
    console.error('Admin bookings API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
