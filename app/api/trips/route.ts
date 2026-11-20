import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import type { TripFilters, PaginatedResponse, Trip } from '@/lib/opentrip-types'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const searchParams = request.nextUrl.searchParams

    // Parse filters
    const filters: TripFilters = {
      category: searchParams.get('category') || undefined,
      status: (searchParams.get('status') as any) || 'published',
      featured: searchParams.get('featured') === 'true',
      search: searchParams.get('search') || undefined,
      min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
      max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
      min_duration: searchParams.get('min_duration') ? Number(searchParams.get('min_duration')) : undefined,
      max_duration: searchParams.get('max_duration') ? Number(searchParams.get('max_duration')) : undefined,
      departure_after: searchParams.get('departure_after') || undefined,
      departure_before: searchParams.get('departure_before') || undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 12,
      sort: (searchParams.get('sort') as any) || 'departure_asc',
    }

    const page = Math.max(1, filters.page || 1)
    const limit = Math.min(50, Math.max(1, filters.limit || 12))
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('trips')
      .select(`
        *,
        category:trip_categories(id, name, slug, icon, color),
        images:trip_images(id, image_url, alt_text, sort_order, is_featured)
      `, { count: 'exact' })
      .range(from, to)

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.featured) {
      query = query.eq('featured', true)
    }

    if (filters.category) {
      query = query.eq('category_id', filters.category)
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,destination.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    if (filters.min_price) {
      query = query.gte('final_price', filters.min_price)
    }

    if (filters.max_price) {
      query = query.lte('final_price', filters.max_price)
    }

    if (filters.min_duration) {
      query = query.gte('duration_days', filters.min_duration)
    }

    if (filters.max_duration) {
      query = query.lte('duration_days', filters.max_duration)
    }

    if (filters.departure_after) {
      query = query.gte('departure_date', filters.departure_after)
    }

    if (filters.departure_before) {
      query = query.lte('departure_date', filters.departure_before)
    }

    // Apply sorting
    const sortMap: Record<string, { column: string; ascending: boolean }> = {
      price_asc: { column: 'final_price', ascending: true },
      price_desc: { column: 'final_price', ascending: false },
      departure_asc: { column: 'departure_date', ascending: true },
      departure_desc: { column: 'departure_date', ascending: false },
      popularity: { column: 'current_participants', ascending: false },
    }

    const sortConfig = sortMap[filters.sort || 'departure_asc'] || { column: 'departure_date', ascending: true }
    query = query.order(sortConfig.column, { ascending: sortConfig.ascending })

    const { data, error, count } = await query

    if (error) throw new Error(error.message)

    // Transform data to include computed fields
    const tripsWithMeta = (data || []).map((trip: any) => ({
      ...trip,
      available_slots: trip.max_participants - trip.current_participants,
      is_full: trip.current_participants >= trip.max_participants,
      category: trip.category || null,
      images: trip.images || [],
    }))

    return NextResponse.json<PaginatedResponse<Trip>>({
      data: tripsWithMeta,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching trips:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal memuat data trip' },
      { status: 500 }
    )
  }
}

// POST - Create new trip (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin only' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      destination,
      description,
      short_description,
      destination_region,
      pickup_location,
      dropoff_location,
      base_price,
      discount_price,
      tax_amount,
      duration_days,
      duration_nights,
      min_participants,
      max_participants,
      departure_date,
      return_date,
      departure_time,
      return_time,
      category_id,
      featured_image,
      gallery_images,
      short_description: body_short_description,
      itinerary,
      highlights,
      inclusions,
      exclusions,
      what_to_bring,
      important_notes,
      cancellation_policy,
      refund_policy,
      faq,
      min_age,
      max_age,
      difficulty_level,
      fitness_required,
      meta_title,
      meta_description,
      meta_keywords,
    } = body

    // Validation
    if (!title || !destination || !description || !base_price || !duration_days || !max_participants || !departure_date || !return_date) {
      return NextResponse.json(
        { success: false, error: 'Field wajib tidak lengkap' },
        { status: 400 }
      )
    }

    if (base_price <= 0) {
      return NextResponse.json(
        { success: false, error: 'Harga harus lebih dari 0' },
        { status: 400 }
      )
    }

    if (new Date(departure_date) >= new Date(return_date)) {
      return NextResponse.json(
        { success: false, error: 'Tanggal keberangkatan harus sebelum tanggal pulang' },
        { status: 400 }
      )
    }

    // Generate slug
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim() + '-' + Date.now().toString(36)

    // Calculate final price
    const calculated_final_price = base_price - (discount_price || 0) + (tax_amount || 0)

    const insertData = {
      title,
      slug,
      destination,
      description,
      short_description: body_short_description,
      destination_region,
      pickup_location,
      dropoff_location,
      base_price,
      discount_price: discount_price || 0,
      tax_amount: tax_amount || 0,
      final_price: calculated_final_price,
      duration_days,
      duration_nights: duration_nights || duration_days - 1,
      min_participants: min_participants || 1,
      max_participants,
      departure_date,
      return_date,
      departure_time,
      return_time,
      category_id: category_id || null,
      featured_image,
      gallery_images: gallery_images || [],
      itinerary,
      highlights,
      inclusions,
      exclusions,
      what_to_bring,
      important_notes,
      cancellation_policy,
      refund_policy,
      faq: faq || [],
      min_age,
      max_age,
      difficulty_level,
      fitness_required: fitness_required || false,
      meta_title,
      meta_description,
      meta_keywords,
      created_by: user.id,
      status: 'draft',
    }

    const { data, error } = await supabase
      .from('trips')
      .insert(insertData)
      .select()
      .single()

    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error('Error creating trip:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Gagal membuat trip' },
      { status: 500 }
    )
  }
}