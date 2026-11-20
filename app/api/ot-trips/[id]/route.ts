import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { requireAdmin } from '@/lib/admin-auth'
import type { Trip, TripStatus, DifficultyLevel } from '@/lib/opentrip-types'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { id } = await params

    // Cek status publish
    const status = await supabase
      .from('ot_trips' as any)
      .select('status, published_at, created_by')
      .eq('id', id)
      .single()
    
    const { data: { user } } = await supabase.auth.getUser()

// Jika status adalah 'draft' dan bukan admin, tampilkan hanya data publik
    if (status.data && status.data.status !== 'published') {
      // Cek apakah user adalah owner trip
      const tripData = await supabase
        .from('ot_trips' as any)
        .select('created_by')
        .eq('id', id)
        .single()

      // Jika bukan admin dan bukan owner, kembalikan 404
      if (!user || user.id !== (tripData.data as { created_by: string | null } | null)?.created_by) {
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
    
    // Transform data
    const trip: Trip = {
      id: data.id,
      title: data.title,
      slug: data.slug,
      description: data.description,
      short_description: data.short_description,
      destination: data.destination,
      destination_region: data.destination_region,
      pickup_location: data.pickup_location,
      dropoff_location: data.dropoff_location,
      base_price: data.base_price,
      discount_price: data.discount_price,
      tax_amount: data.tax_amount,
      final_price: data.final_price,
      currency: data.currency || 'IDR',
      duration_days: data.duration_days,
      duration_nights: data.duration_nights || data.duration_days - 1,
      min_participants: data.min_participants,
      max_participants: data.max_participants,
      current_participants: data.current_participants || 0,
      departure_date: data.departure_date,
      return_date: data.return_date,
      departure_time: data.departure_time,
      return_time: data.return_time,
      status: data.status as TripStatus,
      featured: data.featured,
      priority: data.priority,
      category_id: data.category_id,
      featured_image: data.featured_image,
      gallery_images: data.images || [],
      itinerary: data.itinerary,
      highlights: data.highlights,
      inclusions: data.inclusions,
      exclusions: data.exclusions,
      what_to_bring: data.what_to_bring,
      important_notes: data.important_notes,
      cancellation_policy: data.cancellation_policy,
      refund_policy: data.refund_policy,
      faq: data.faq,
      min_age: data.min_age,
      max_age: data.max_age,
      difficulty_level: data.difficulty_level as DifficultyLevel | null,
      fitness_required: data.fitness_required,
      meta_title: data.meta_title,
      meta_description: data.meta_description,
      meta_keywords: data.meta_keywords,
      created_by: data.created_by,
      created_at: data.created_at,
      updated_at: data.updated_at,
      published_at: data.published_at,
      archived_at: data.archived_at,
      category: data.category,
    }
    
    return NextResponse.json<Trip>({ data: trip, success: true })
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
    if (!guard.success) {
      return NextResponse.json({ success: false, error: guard.error }, { status: 403 })
    }
    
    const body = await request.json()
    
    // Build update data dynamically
    const updateData: any = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.destination !== undefined) updateData.destination = body.destination
    if (body.description !== undefined) updateData.description = body.description
    if (body.destination_region !== undefined) updateData.destination_region = body.destination_region
    if (body.pickup_location !== undefined) updateData.pickup_location = body.pickup_location
    if (body.dropoff_location !== undefined) updateData.dropoff_location = body.dropoff_location
    if (body.base_price !== undefined) updateData.base_price = body.base_price
    if (body.discount_price !== undefined) updateData.discount_price = body.discount_price
    if (body.tax_amount !== undefined) updateData.tax_amount = body.tax_amount
    if (body.final_price !== undefined) updateData.final_price = body.final_price
    if (body.duration_days !== undefined) updateData.duration_days = body.duration_days
    if (body.duration_nights !== undefined) updateData.duration_nights = body.duration_nights
    if (body.min_participants !== undefined) updateData.min_participants = body.min_participants
    if (body.max_participants !== undefined) updateData.max_participants = body.max_participants
    if (body.departure_date !== undefined) updateData.departure_date = body.departure_date
    if (body.return_date !== undefined) updateData.return_date = body.return_date
    if (body.departure_time !== undefined) updateData.departure_time = body.departure_time
    if (body.return_time !== undefined) updateData.return_time = body.return_time
    if (body.featured_image !== undefined) updateData.featured_image = body.featured_image
    if (body.gallery_images !== undefined) updateData.gallery_images = body.gallery_images
    if (body.short_description !== undefined) updateData.short_description = body.short_description
    if (body.itinerary !== undefined) updateData.itinerary = body.itinerary
    if (body.highlights !== undefined) updateData.highlights = body.highlights
    if (body.inclusions !== undefined) updateData.inclusions = body.inclusions
    if (body.exclusions !== undefined) updateData.exclusions = body.exclusions
    if (body.what_to_bring !== undefined) updateData.what_to_bring = body.what_to_bring
    if (body.important_notes !== undefined) updateData.important_notes = body.important_notes
    if (body.cancellation_policy !== undefined) updateData.cancellation_policy = body.cancellation_policy
    if (body.refund_policy !== undefined) updateData.refund_policy = body.refund_policy
    if (body.faq !== undefined) updateData.faq = body.faq
    if (body.min_age !== undefined) updateData.min_age = body.min_age
    if (body.max_age !== undefined) updateData.max_age = body.max_age
    if (body.difficulty_level !== undefined) updateData.difficulty_level = body.difficulty_level
    if (body.fitness_required !== undefined) updateData.fitness_required = body.fitness_required
    if (body.meta_title !== undefined) updateData.meta_title = body.meta_title
    if (body.meta_description !== undefined) updateData.meta_description = body.meta_description
    if (body.meta_keywords !== undefined) updateData.meta_keywords = body.meta_keywords
    if (body.featured !== undefined) updateData.featured = body.featured
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.status !== undefined) updateData.status = body.status
    
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

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const guard = await requireAdmin()
    if (!guard.success) {
      return NextResponse.json({ success: false, error: guard.error }, { status: 403 })
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