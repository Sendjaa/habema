import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from('equipment')
      .select(`
        *,
        equipment_categories (
          name
        )
      `)
      .eq('is_active', true)
      .eq('is_promo', true)
      .limit(6)
      .order('rental_count', { ascending: false })

    if (error) throw new Error(error.message)

    const featured = (data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      price: Number(item.price_per_night) || 0,
      image: item.image_url || '',
      rating: Number(item.average_rating) || 0,
      equipment_categories: item.equipment_categories,
    }));

    return NextResponse.json(featured)
  } catch (error) {
    console.error('Features API error:', error)
    return NextResponse.json([])
  }
}