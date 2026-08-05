import { NextResponse } from 'next/server'

// Cache TTL in seconds
const CACHE_TTL = 600; // 10 minutes
let cachedData: any = null;
let cacheTimestamp = 0;

export async function GET(request: Request) {
  const now = Date.now();
  const { searchParams } = new URL(request.url)

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
  const limit = parseInt(searchParams.get('limit') || '15')
  
  // Generate cache key based on limit
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
    // Fetch featured products from database with optimized query
    const { data, error } = await supabase
      .from('equipment')
      .select(`
        id,
        name,
        description,
        price_per_night,
        image_url,
        rental_count,
        average_rating,
        equipment_categories(
          name
        )
      `)
      .eq('is_active', true)
      .or('rental_count.gt.10,average_rating.gte.4.5')
      .order('rental_count', { ascending: false })
      .order('average_rating', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Database error:', error)
      
      // Return cached data if available, even if expired
      if (cachedData && cachedData[cacheKey]) {
        return NextResponse.json({
          success: true,
          data: cachedData[cacheKey].data,
          cached: true,
          stale: true,
          timestamp: cachedData[cacheKey].timestamp,
          warning: 'Serving stale data due to database error'
        });
      }
      
      // Return empty list — jangan pakai fallback id palsu ('1', '2', ...)
      // yang tidak ada di tabel equipment (menghasilkan dead-link ke /product/1).
      return NextResponse.json({
        success: true,
        data: [],
        fallback: true
      })
    }

    // Transform data for frontend
    const transformedData = data?.map((item: any) => ({
      ...item,
      price_per_night: Number(item.price_per_night) || 0,
      average_rating: Number(item.average_rating) || 4.9,
      rental_count: Number(item.rental_count) || 0
    })) || [];

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
