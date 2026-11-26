import { NextResponse } from 'next/server'
import { DEV_LOCAL_AUTH } from '@/lib/dev-local-auth'

// =====================================================================
// POST /api/dev/qris/complete
// Hanya untuk dev lokal: menandai booking QRIS manual sebagai lunas dan
// terkonfirmasi tanpa upload bukti + verifikasi admin. Dipakai untuk
// demonstrasi alur pembayaran QRIS saat tidak ada pembayaran sungguhan.
// Di production route ini selalu 404 (DEV_LOCAL_AUTH = false).
// =====================================================================
export async function POST(request: Request) {
  if (!DEV_LOCAL_AUTH) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    let supabaseAdmin: any
    try {
      const mod = await import('@/lib/supabaseAdmin')
      supabaseAdmin = mod.supabaseAdmin
    } catch (e: any) {
      console.error('Supabase admin init failed:', e.message)
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const body = await request.json().catch(() => ({}))
    const bookingId = typeof body.bookingId === 'string' ? body.bookingId.trim() : ''
    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId wajib dikirim' }, { status: 400 })
    }

    const { data: booking, error: findError } = await supabaseAdmin
      .from('bookings')
      .select('id, user_id, total_cost, payment_status')
      .eq('id', bookingId)
      .single()

    if (findError || !booking) {
      return NextResponse.json({ error: 'Booking tidak ditemukan' }, { status: 404 })
    }

    const now = new Date().toISOString()
    const demoProofSvg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="960" viewBox="0 0 720 960">` +
      `<rect width="720" height="960" fill="#f0fdf4"/>` +
      `<rect x="40" y="40" width="640" height="880" rx="24" fill="#ffffff" stroke="#86efac" stroke-width="4"/>` +
      `<text x="360" y="140" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="bold" fill="#166534">BUKTI PEMBAYARAN</text>` +
      `<text x="360" y="200" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#15803d">MODE DEMO (DEV)</text>` +
      `<text x="360" y="330" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" fill="#334155">QRIS Manual</text>` +
      `<text x="360" y="390" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" font-weight="bold" fill="#0f172a">Rp${Number(booking.total_cost || 0).toLocaleString('id-ID')}</text>` +
      `<text x="360" y="470" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#166534">BERHASIL</text>` +
      `<text x="360" y="560" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#64748b">Booking #${bookingId.slice(0, 8)}</text>` +
      `<text x="360" y="600" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#64748b">${now.replace('T', ' ').slice(0, 19)}</text>` +
      `<text x="360" y="820" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#94a3b8">Gambar ini dibuat otomatis oleh mode dev.</text>` +
      `<text x="360" y="850" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#94a3b8">Bukan bukti transaksi sungguhan.</text>` +
      `</svg>`
    const demoProofUrl = `data:image/svg+xml;base64,${Buffer.from(demoProofSvg).toString('base64')}`

    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        status: 'confirmed',
        payment_status: 'paid',
        payment_proof_url: demoProofUrl,
        payment_proof_uploaded_at: now,
        updated_at: now,
      })
      .eq('id', bookingId)

    if (updateError) {
      console.error('[dev/qris/complete] update failed:', updateError.message)
      return NextResponse.json(
        { error: 'Gagal menandai pembayaran', detail: updateError.message },
        { status: 500 }
      )
    }

    try {
      if (booking.user_id) {
        await supabaseAdmin.from('notifications').insert({
          user_id: booking.user_id,
          booking_id: bookingId,
          title: 'Pembayaran Diterima (Demo)',
          message: `Pembayaran QRIS booking #${bookingId.slice(0, 8)} disimulasikan lunas di mode dev`,
          notification_type: 'payment_confirmed',
          is_read: false,
        })
      }
    } catch (notifErr) {
      console.error('[dev/qris/complete] notification failed:', notifErr)
    }

    return NextResponse.json({ success: true, data: { bookingId } })
  } catch (error: any) {
    console.error('[dev/qris/complete] error:', error?.message || error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
