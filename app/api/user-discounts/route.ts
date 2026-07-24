import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    let supabaseAdmin: any
    try {
      const mod = await import('@/lib/supabaseAdmin')
      supabaseAdmin = mod.supabaseAdmin
    } catch (e: any) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const { data: claims, error } = await supabaseAdmin
      .from('user_discounts')
      .select(`
        id,
        claimed_at,
        used_at,
        discount:discount_id (
          id,
          code,
          description,
          discount_type,
          discount_value,
          min_purchase,
          max_discount,
          applies_to,
          target_id
        )
      `)
      .eq('user_id', userId)
      .order('claimed_at', { ascending: false })

    if (error) {
      console.error('Error fetching user discounts:', error)
      return NextResponse.json({ error: 'Failed to fetch user discounts' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: claims || [],
    })
  } catch (error) {
    console.error('User discounts API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
