import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('equipment_categories')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) throw new Error(error.message)

    return NextResponse.json(data)
  } catch (error) {
    console.error('Categories API error:', error)
    // Return fallback categories if database fails
    const fallbackCategories = [
      { id: '1', name: 'Tenda', description: 'Berbagai jenis tenda untuk camping' },
      { id: '2', name: 'Sleeping Bag', description: 'Kantong tidur yang nyaman' },
      { id: '3', name: 'Backpack', description: 'Tas ransel untuk hiking' },
      { id: '4', name: 'Cooking Set', description: 'Peralatan memasak outdoor' }
    ]
    return NextResponse.json(fallbackCategories)
  }
}
