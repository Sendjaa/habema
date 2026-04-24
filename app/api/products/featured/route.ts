import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '4')

    // Fetch featured products from database
    const { data, error } = await supabase
      .from('equipment')
      .select(`
        *,
        equipment_categories(name)
      `)
      .eq('is_active', true)
      .order('rental_count', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching featured products:', error)
      // Return fallback products if database fails
      const fallbackProducts = [
        {
          id: '1',
          name: 'Tenda Arpenaz 4.1',
          price_per_night: 75000,
          image_url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=500',
          equipment_categories: { name: 'Tenda' },
          rental_count: 25
        },
        {
          id: '2',
          name: 'Sleeping Bag Premium',
          price_per_night: 45000,
          image_url: 'https://images.unsplash.com/photo-1544283093-1e76c3eca3a8?q=80&w=500',
          equipment_categories: { name: 'Sleeping Bag' },
          rental_count: 18
        }
      ]
      return NextResponse.json(fallbackProducts)
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Featured products API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch featured products' },
      { status: 500 }
    )
  }
}
