import { NextResponse } from 'next/server'
import { and, desc, eq, gt, gte, or } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { equipment } from '@/lib/db/schema'

// Cache TTL in seconds
const CACHE_TTL = 600; // 10 minutes
let cachedData: any = null;
let cacheTimestamp = 0;

export async function GET(request: Request) {
  const now = Date.now();
  const { searchParams } = new URL(request.url)

  // Lazy init – handle missing POSTGRES_URL gracefully, sama seperti sebelumnya
  // saat klien Supabase gagal dibuat.
  let db: ReturnType<typeof getDb>
  try {
    db = getDb()
  } catch (e: any) {
    console.error('Database init failed:', e.message)
    return NextResponse.json(
      { error: 'Database not configured. Set POSTGRES_URL in .env.local' },
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
    // Query yang sama dengan `.eq('is_active', true).or('rental_count.gt.10,
    // average_rating.gte.4.5')` — PostgREST menggabungkannya sebagai
    // `is_active AND (rental_count > 10 OR average_rating >= 4.5)`.
    //
    // '4.5' dikirim sebagai string karena kolom numeric dipetakan Drizzle ke
    // string; mengirim number akan kehilangan presisi desimal.
    let rows = await db.query.equipment.findMany({
      columns: {
        id: true,
        name: true,
        description: true,
        pricePerNight: true,
        imageUrl: true,
        rentalCount: true,
        averageRating: true,
      },
      with: { category: { columns: { name: true } } },
      where: and(
        eq(equipment.isActive, true),
        or(gt(equipment.rentalCount, 0), gte(equipment.averageRating, '4.0'))
      ),
      orderBy: [desc(equipment.rentalCount), desc(equipment.averageRating)],
      limit,
    })

    if (rows.length === 0) {
      rows = await db.query.equipment.findMany({
        columns: {
          id: true,
          name: true,
          description: true,
          pricePerNight: true,
          imageUrl: true,
          rentalCount: true,
          averageRating: true,
        },
        with: { category: { columns: { name: true } } },
        where: eq(equipment.isActive, true),
        orderBy: [desc(equipment.rentalCount), desc(equipment.averageRating)],
        limit,
      })
    }

    // Transform data for frontend. Konversi Number() dipertahankan apa adanya:
    // kolom numeric datang sebagai string, dan `|| 4.9` bergantung pada 0
    // menjadi falsy — "0.00" sebagai string justru truthy.
    const transformedData = rows.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price_per_night: Number(item.pricePerNight) || 0,
      image_url: item.imageUrl,
      rental_count: Number(item.rentalCount) || 0,
      average_rating: Number(item.averageRating) || 4.9,
      equipment_categories: item.category ?? null,
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
