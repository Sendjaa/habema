import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

// Cache TTL in seconds
const CACHE_TTL = 600; // 10 minutes
let cachedData: any = null;
let cacheTimestamp = 0;

export async function GET(request: Request) {
  const now = Date.now();
  const { searchParams } = new URL(request.url)

  const supabase = await createServerSupabaseClient();

  const limit = parseInt(searchParams.get('limit') || '15')

  const cacheKey = `featured-products-${limit}`;

  // Return cached data if still valid
  if (cachedData && cachedData[cacheKey] && (now - cachedData[cacheKey].timestamp) < (CACHE_TTL * 1000)) {
    return NextResponse.json({
      success: true,
      data: cachedData[cacheKey].data,
      cached: true,
      timestamp: cachedData[cacheKey].timestamp
    });
  }

  try {
    const { data, error } = await supabase
      .from('equipment')
      .select(`
        *,
        equipment_categories (
          id,
          name
        )
      `)
      .eq('is_active', true)
      .gte('rental_count', 0)
      .gte('average_rating', '4.0')
      .order('rental_count', { ascending: false })
      .limit(limit)

    const rows = data || [];

    const transformedData = rows.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price_per_night: Number(item.price_per_night) || 0,
      image_url: item.image_url,
      rental_count: Number(item.rental_count) || 0,
      average_rating: Number(item.average_rating) || 4.9,
      equipment_categories: item.equipment_categories ?? null,
    }))

    // Cache successful response
    if (!cachedData) cachedData = {};
    cachedData[cacheKey] = {
      data: transformedData,
      timestamp: now
    };

    return NextResponse.json({
      success: true,
      data: transformedData,
      cached: false,
      timestamp: now,
      count: transformedData.length
    });
  } catch (error) {
    console.error('API Error:', error)

    // Return cached data if available, even if expired
    if (cachedData && cachedData[cacheKey]) {
      return NextResponse.json({
        success: true,
        data: cachedData[cacheKey].data,
        cached: true,
        stale: true,
        timestamp: cachedData[cacheKey].timestamp,
        warning: 'Serving stale data due to API error'
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch featured products',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Invalidate cache endpoint
export async function POST() {
  cachedData = null;
  cacheTimestamp = 0;

  return NextResponse.json({
    success: true,
    message: 'Cache invalidated successfully'
  });
}
