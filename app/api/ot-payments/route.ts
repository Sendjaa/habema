import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

// DP = 50% deposit, Lunas = full payment
const DP_PERCENT = 0.5

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await (supabase as any).auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const bookingId = String(body?.bookingId ?? '').trim()
    const method = String(body?.method ?? 'dp').toString().toLowerCase()
    const fullName = String(body?.fullName ?? '').trim()
    const whatsapp = String(body?.whatsapp ?? '').trim()
    const emergencyContact = String(body?.emergencyContact ?? '').trim()

    if (!['dp', 'lunas'].includes(method)) return NextResponse.json({ error: 'Invalid method' }, { status: 400 })
    if (!bookingId) return NextResponse.json({ error: 'bookingId wajib dikirim' }, { status: 400 })

    const { data: booking, error: findError } = await (supabase as any)
      .from('ot_bookings')
      .select('id, user_id, trip_id, booking_code, total_price, total_participants, payment_status, booking_status')
      .eq('id', bookingId)
      .single()

    if (findError || !booking) return NextResponse.json({ error: 'Booking tidak ditemukan' }, { status: 404 })
    if (booking.user_id !== user.id) return NextResponse.json({ error: 'Unauthorized: Bukan pemilik booking ini' }, { status: 403 })

    const fullPrice = Math.round(Number(booking.total_price ?? 0))
    const participants = Number(booking.total_participants) || 1

    const isFull = method === 'lunas'
    const amount = isFull ? fullPrice : Math.round(fullPrice * 0.5)

    const { error: payError, data: paymentData } = await (supabase as any)
      .from('ot_payments')
      .insert({
        user_id: user.id,
        trip_id: booking.trip_id,
        amount,
        status: isFull ? 'completed' : 'pending',
        payment_method: 'qris',
        net_amount: isFull ? fullPrice : Math.round(fullPrice * 0.5),
        transaction_id: `OT-${isFull ? 'LUNAS' : 'DP'}-${booking.booking_code?.slice(0, 8)}`,
      })
      .select()

    if (payError) {
      console.error('[ot-payments] insert error:', payError.message, payError.details, payError.hint)
      const errorMsg =
        payError.message?.includes('constraint') || payError.message?.includes('check')
          ? 'Gagal menyimpan data pembayaran: data tidak valid (mis. amount harus > 0)'
          : payError.message?.includes('RLS') || payError.message?.includes('permission') || payError.message?.includes('policy')
            ? 'Gagal menyimpan data pembayaran: akses database ditolak'
            : 'Gagal menyimpan data pembayaran'
      return NextResponse.json({ error: errorMsg }, { status: 500 })
    }

    const { error: updateError } = await (supabase as any)
      .from('ot_bookings')
      .update({
        payment_status: isFull ? 'paid' : 'partial',
        booking_status: isFull ? 'confirmed' : booking.booking_status ?? 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)

    if (updateError) {
      return NextResponse.json({ error: 'Gagal memperbarui booking' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        bookingId,
        method,
        amount,
        status: isFull ? 'paid' : 'partial',
        payment: paymentData,
      },
    })
  } catch (error: any) {
    console.error('[ot-payments] error:', error?.message || error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}