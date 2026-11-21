import { NextResponse } from 'next/server'

/**
 * Konten operasional halaman /opentrip.
 *
 * Semua data di sini sebelumnya ditulis statis (atau bahkan tidak pernah
 * didefinisikan) di app/opentrip/page.tsx: voucher, gear add-on, FAQ, galeri
 * lapangan, dan testimoni peserta. Sekarang sumbernya database dan bisa
 * dikelola dari /admin/opentrip.
 *
 * Endpoint ini hanya membaca baris aktif, memakai service-role karena join
 * ulasan ke tabel users tidak terbaca oleh anon. Kolom yang dikembalikan
 * dibatasi ke data publik.
 */

async function getAdminClient() {
  try {
    const mod = await import('@/lib/supabaseAdmin')
    return mod.supabaseAdmin
  } catch {
    return null
  }
}

type Row = Record<string, any>

export async function GET() {
  const supabase = (await getAdminClient()) as any
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const [vouchersRes, gearRes, faqsRes, galleryRes, reviewsRes] = await Promise.all([
    supabase
      .from('ot_vouchers')
      .select('id, code, title, discount_amount, min_participants, valid_until, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('ot_gear_addons')
      .select('id, name, spec, price_per_trip, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('ot_faqs')
      .select('id, question, answer, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('ot_field_gallery')
      .select('id, image_url, caption, location, elevation, trip_title, taken_at, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('ot_trip_reviews')
      .select(
        'id, rating, title, content, pros, is_featured, created_at, trip:ot_trips!trip_id(title), user:users!user_id(full_name, profile_image_url)'
      )
      .eq('is_approved', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(24),
  ])

  const firstError =
    vouchersRes.error || gearRes.error || faqsRes.error || galleryRes.error || reviewsRes.error

  if (firstError) {
    console.error('[opentrip-content] gagal membaca konten:', firstError.message)
    return NextResponse.json({ error: 'Gagal memuat konten open trip' }, { status: 500 })
  }

  const vouchers = ((vouchersRes.data ?? []) as Row[]).map((row) => ({
    id: String(row.id),
    code: String(row.code),
    title: String(row.title),
    discountAmount: Number(row.discount_amount) || 0,
    minParticipants: Number(row.min_participants) || 1,
    validUntil: row.valid_until
      ? new Date(row.valid_until).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : null,
  }))

  const gear = ((gearRes.data ?? []) as Row[]).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    spec: row.spec ? String(row.spec) : '',
    pricePerTrip: Number(row.price_per_trip) || 0,
  }))

  const faqs = ((faqsRes.data ?? []) as Row[]).map((row) => ({
    id: String(row.id),
    question: String(row.question),
    answer: String(row.answer),
  }))

  const gallery = ((galleryRes.data ?? []) as Row[]).map((row) => ({
    id: String(row.id),
    imageUrl: String(row.image_url),
    caption: row.caption ? String(row.caption) : '',
    location: row.location ? String(row.location) : '',
    elevation: row.elevation ? String(row.elevation) : '',
    tripTitle: row.trip_title ? String(row.trip_title) : '',
    date: row.taken_at
      ? new Date(row.taken_at).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
      : '',
  }))

  const reviews = ((reviewsRes.data ?? []) as Row[]).map((row) => ({
    id: String(row.id),
    participant: row.user?.full_name ? String(row.user.full_name) : 'Peserta Habema',
    avatar: row.user?.profile_image_url ? String(row.user.profile_image_url) : null,
    trip: row.trip?.title ? String(row.trip.title) : 'Open Trip Habema',
    rating: Number(row.rating) || 0,
    highlight: Boolean(row.is_featured),
    note: row.content ? String(row.content) : '',
  }))

  return NextResponse.json({ success: true, data: { vouchers, gear, faqs, gallery, reviews } })
}
