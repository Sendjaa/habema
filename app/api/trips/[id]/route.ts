import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { requireAdmin } from '@/lib/admin-auth'
import type { OtTrip, OtTripStatus, OtDifficultyLevel } from '@/lib/opentrip-types'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { id } = await params
    if (!id) {
      return NextResponse.json({ success: false, error: 'Trip ID wajib diisi' }, { status: 400 })
    }

    // Cek status publish
    const status = await supabase
      .from('ot_trips' as any)
      .select('status, published_at, created_by')
      .eq('id', id)
      .single()

    const statusData = status.data as { status: string; created_by: string | null } | null
    if (!statusData) {
      return NextResponse.json({ success: false, error: 'Trip tidak ditemukan' }, { status: 404 })
    }

    // Jika status adalah 'draft' dan bukan admin, tampilkan hanya data publik
    if (statusData.status !== 'published') {
      // Cek apakah user adalah owner trip
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.id !== statusData.created_by) {
        return NextResponse.json(
          { success: false, error: 'Trip tidak ditemukan atau tidak diakses' },
          { status: 404 }
        )
      }
    }

    const { data, error } = await supabase
      .from('ot_trips' as any)
      .select(`
        *,
        category:ot_trip_categories(id, name, slug, icon, color),
        images:ot_trip_images(id, image_url, alt_text, sort_order)
      `)
      .eq('id', id)
      .single()

    if (error) throw new Error(error.message)

      const tripData = data as Record<string, any>
    const trip: OtTrip = {
        id: tripData.id,
        title: tripData.title,
        slug: tripData.slug,
        description: tripData.description,
        short_description: tripData.short_description,
        destination: tripData.destination,
        destination_region: tripData.destination_region,
        pickup_location: tripData.pickup_location,
        dropoff_location: tripData.dropoff_location,
        base_price: tripData.base_price,
        discount_price: tripData.discount_price,
        tax_amount: tripData.tax_amount,
        final_price: tripData.final_price,
        currency: tripData.currency || 'IDR',
        duration_days: tripData.duration_days,
        duration_nights: tripData.duration_nights || tripData.duration_days - 1,
        min_participants: tripData.min_participants,
        max_participants: tripData.max_participants,
        current_participants: tripData.current_participants || 0,
        departure_date: tripData.departure_date,
        return_date: tripData.return_date,
        departure_time: tripData.departure_time,
        return_time: tripData.return_time,
        status: tripData.status as OtTripStatus,
        featured: tripData.featured,
        priority: tripData.priority,
        category_id: tripData.category_id,
        featured_image: tripData.featured_image,
        gallery_images: tripData.images || [],
        itinerary: tripData.itinerary,
        highlights: tripData.highlights,
        inclusions: tripData.inclusions,
        exclusions: tripData.exclusions,
        what_to_bring: tripData.what_to_bring,
        important_notes: tripData.important_notes,
        cancellation_policy: tripData.cancellation_policy,
        refund_policy: tripData.refund_policy,
        faq: tripData.faq,
        min_age: tripData.min_age,
        max_age: tripData.max_age,
        difficulty_level: tripData.difficulty_level as OtDifficultyLevel | null,
        fitness_required: tripData.fitness_required,
        meta_title: tripData.meta_title,
        meta_description: tripData.meta_description,
        meta_keywords: tripData.meta_keywords,
        created_by: tripData.created_by,
        created_at: tripData.created_at,
        updated_at: tripData.updated_at,
        published_at: tripData.published_at,
        archived_at: tripData.archived_at,
        category: tripData.category,
    }

    return NextResponse.json({ success: true, data: trip })
  } catch (error) {
    console.error('Error fetching trip:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil detail trip' },
      { status: 500 }
    )
  }
}

// PUT - Update trip (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const guard = await requireAdmin()
    if (!guard.ok) {
      return guard.response
    }

    const { id } = await params
    const body = await request.json()

    const updateData: Record<string, unknown> = {}
    const allowedFields = [
      'title', 'destination', 'description', 'short_description',
      'destination_region', 'pickup_location', 'dropoff_location',
      'base_price', 'discount_price', 'tax_amount', 'final_price',
      'duration_days', 'duration_nights', 'min_participants', 'max_participants',
      'departure_date', 'return_date', 'departure_time', 'return_time',
      'category_id', 'featured_image', 'gallery_images', 'itinerary',
      'highlights', 'inclusions', 'exclusions', 'what_to_bring',
      'important_notes', 'cancellation_policy', 'refund_policy', 'faq',
      'min_age', 'max_age', 'difficulty_level', 'fitness_required',
      'meta_title', 'meta_description', 'meta_keywords',
      'featured', 'priority', 'status'
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) updateData[field] = body[field]
    }

    const { data, error } = await supabase
      .from('ot_trips' as any)
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error updating trip:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Gagal memperbarui trip' },
      { status: 500 }
    )
  }
}

// DELETE - Delete trip (admin only)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()

    const guard = await requireAdmin()
    if (!guard.ok) {
      return guard.response
    }

    const { id } = await params

    const { error } = await supabase
      .from('ot_trips' as any)
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true, message: 'Trip berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting trip:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Gagal menghapus trip' },
      { status: 500 }
    )
  }
}