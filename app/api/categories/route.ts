import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Lazy import supabase – handle missing env gracefully
    let supabase: any
    try {
      const mod = await import('@/lib/supabaseClient')
      supabase = mod.supabase
    } catch (e: any) {
      console.error('Supabase client init failed:', e.message)
      return NextResponse.json(
        { error: 'Database not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local' },
        { status: 503 }
      )
    }

    // Fetch categories from database
    const { data, error } = await supabase
      .from('equipment_categories')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching categories:', error)
      // Return fallback categories if database fails
      const fallbackCategories = [
        { id: '1', name: 'Tenda', description: 'Berbagai jenis tenda untuk camping' },
        { id: '2', name: 'Sleeping Bag', description: 'Kantong tidur yang nyaman' },
        { id: '3', name: 'Backpack', description: 'Tas ransel untuk hiking' },
        { id: '4', name: 'Cooking Set', description: 'Peralatan memasak outdoor' }
      ]
      return NextResponse.json(fallbackCategories)
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Categories API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}
