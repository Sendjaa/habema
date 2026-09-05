import { NextRequest, NextResponse } from 'next/server'

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const BUCKET = 'payment-proofs';

// =====================================================================
// POST /api/bookings/upload-proof (multipart: bookingId + proof)
// Menerima screenshot bukti pembayaran QRIS manual, menyimpan ke
// Storage, lalu menautkan URL-nya ke bookings.payment_proof_url.
// Upload dilakukan server-side via service-role sehingga tidak
// bergantung pada RLS policy client.
// =====================================================================
export async function POST(request: NextRequest) {
  try {
    let supabaseAdmin: any
    try {
      const mod = await import('@/lib/supabaseAdmin')
      supabaseAdmin = mod.supabaseAdmin
    } catch (e: any) {
      console.error('Supabase admin init failed:', e.message)
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      )
    }

    const form = await request.formData().catch(() => null)
    if (!form) {
      return NextResponse.json(
        { error: 'Body harus multipart/form-data' },
        { status: 400 }
      )
    }

    const bookingId = String(form.get('bookingId') || '')
    const proof = form.get('proof')

    if (!bookingId) {
      return NextResponse.json(
        { error: 'bookingId wajib dikirim' },
        { status: 400 }
      )
    }
    if (!proof || typeof proof === 'string') {
      return NextResponse.json(
        { error: 'File bukti pembayaran wajib dikirim' },
        { status: 400 }
      )
    }

    const file = proof as File
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File harus berupa gambar (JPG, PNG, dll)' },
        { status: 400 }
      )
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File terlalu besar (Maksimal 5MB)' },
        { status: 400 }
      )
    }

    // Pastikan booking ada (bookingId UUID tidak mudah ditebak)
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('id, user_id, total_cost')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking tidak ditemukan' },
        { status: 404 }
      )
    }

    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().slice(0, 5)
    const owner = booking.user_id || 'guest'
    const path = `${owner}/${bookingId}_${Date.now()}.${ext}`
    const bytes = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: file.type, upsert: false })

    if (uploadError) {
      console.error('Proof upload failed:', uploadError.message)
      return NextResponse.json(
        { error: 'Gagal menyimpan bukti. Pastikan bucket payment-proofs sudah dibuat (lihat migrasi SQL).', detail: uploadError.message },
        { status: 500 }
      )
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(path)
    const proofUrl = urlData?.publicUrl || null

    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        payment_proof_url: proofUrl,
        payment_proof_uploaded_at: new Date().toISOString(),
        payment_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)

    if (updateError) {
      console.error('Proof link failed:', updateError.message)
      // Bersihkan file yatim agar storage tidak penuh sampah
      await supabaseAdmin.storage.from(BUCKET).remove([path]).catch(() => null)
      const missingColumn =
        updateError.code === '42703' ||
        /payment_proof/i.test(updateError.message || '')
      return NextResponse.json(
        {
          error: missingColumn
            ? 'Kolom payment_proof_url belum ada. Jalankan migrasi supabase/migrations/20260904000000_manual_qris_payment_proof.sql terlebih dahulu.'
            : 'Gagal menautkan bukti ke pesanan',
          detail: updateError.message,
        },
        { status: 500 }
      )
    }

    // Notifikasi untuk admin/pemilik (best-effort)
    try {
      if (booking.user_id) {
        await supabaseAdmin.from('notifications').insert({
          user_id: booking.user_id,
          booking_id: bookingId,
          title: 'Bukti Pembayaran Masuk',
          message: `Bukti pembayaran QRIS untuk booking #${bookingId.slice(0, 8)} menunggu verifikasi`,
          notification_type: 'payment_proof',
          is_read: false,
        })
      }
    } catch (notifErr) {
      console.error('Error creating proof notification:', notifErr)
    }

    // Email konfirmasi (best-effort, tidak menggagalkan respons)
    try {
      const {
        sendProofReceivedEmail,
        sendNewProofAdminEmail,
      } = await import('@/lib/booking-email');
      let customerEmail: string | null = null;
      if (booking.user_id) {
        const { data } = await supabaseAdmin.auth.admin.getUserById(booking.user_id);
        customerEmail = (data?.user as any)?.email || null;
      }
      if (customerEmail) {
        await sendProofReceivedEmail(customerEmail, {
          bookingId,
          total: Number(booking.total_cost) || 0,
        });
      }
      await sendNewProofAdminEmail({
        bookingId,
        total: Number(booking.total_cost) || 0,
        customerEmail,
      });
    } catch (emailErr) {
      console.error('Error sending proof emails:', emailErr);
    }

    return NextResponse.json({ success: true, data: { proofUrl } })
  } catch (error) {
    console.error('Upload proof API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
