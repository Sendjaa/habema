import { NextResponse, NextRequest } from 'next/server'
import { verifyMidtransSignature } from '@/lib/midtrans'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Minimal Booking type to satisfy server-side typings for webhook updates
type Booking = {
  id: string
  user_id: string
  payment_status?: string
  payment_method?: string
  status?: string
  midtrans_order_id?: string
}

// GET handler — Midtrans verifikasi URL dengan GET
export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'Midtrans webhook endpoint is active' })
}

/**
 * Midtrans Server-to-Server Notification Webhook
 * Midtrans akan POST ke endpoint ini saat status pembayaran berubah.
 * Wajib return 200 OK, atau Midtrans akan retry.
 */
async function incrementRentalCount(bookingId: string) {
  const { data: items, error } = await supabaseAdmin
    .from('booking_items')
    .select('equipment_id, quantity')
    .eq('booking_id', bookingId)

  if (error || !items) {
    console.error('[webhook] Gagal ambil booking_items:', error?.message)
    return
  }

  for (const item of items) {
    const qty = item.quantity ?? 1

    const { data: equip } = await supabaseAdmin
      .from('equipment')
      .select('rental_count')
      .eq('id', item.equipment_id)
      .single()

    if (equip) {
      const newCount = (equip.rental_count || 0) + qty
      await supabaseAdmin
        .from('equipment')
        .update({ rental_count: newCount })
        .eq('id', item.equipment_id)
    }
  }

  console.log(`[webhook] rental_count ditambahkan untuk ${items.length} equipment`)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      order_id,
      status_code,
      gross_amount,
      transaction_status,
      signature_key,
      fraud_status,
      payment_type,
    } = body

    console.log('[webhook] Midtrans notification received:', {
      order_id,
      transaction_status,
      status_code,
      fraud_status,
    })

    // 1) Verifikasi signature (return 200 untuk test notification dari Midtrans)
    let signatureValid = false
    if (signature_key && order_id && order_id !== 'test-notification') {
      signatureValid = verifyMidtransSignature({
        order_id: order_id || '',
        status_code: String(status_code || ''),
        gross_amount: String(gross_amount || ''),
        signature_key,
      })

      if (!signatureValid) {
        console.error('[webhook] Invalid signature for order:', order_id)
        return NextResponse.json({ message: 'Webhook received' }, { status: 200 })
      }
    } else {
      // Test notification dari Midtrans — return 200 tanpa proses
      console.log('[webhook] Test notification received, returning OK')
      return NextResponse.json({ message: 'Webhook received' }, { status: 200 })
    }

    // 2) Map transaction_status ke payment_status kita
    let paymentStatus: string
    let bookingStatus: string | null = null

    switch (transaction_status) {
      case 'capture':
      case 'settlement':
        paymentStatus = 'paid'
        bookingStatus = 'confirmed'
        break
      case 'pending':
        paymentStatus = 'pending'
        break
      case 'deny':
      case 'cancel':
      case 'expire':
        paymentStatus = 'failed'
        bookingStatus = 'cancelled'
        break
      case 'refund':
        paymentStatus = 'refunded'
        bookingStatus = 'cancelled'
        break
      default:
        paymentStatus = transaction_status || 'unknown'
    }

    // 3) Update booking di database
    const updateData: Partial<Booking> = {
      payment_status: paymentStatus,
      ...(payment_type ? { payment_method: payment_type } : {}),
    }
    if (bookingStatus) {
      updateData.status = bookingStatus
    }

    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('id, user_id')
      .eq('midtrans_order_id', order_id)
      .single()

    let bookingId: string | null = null

    if (!booking && fetchError) {
      console.warn('[webhook] Booking not found for order_id:', order_id, '- trying by id')
      const { data: byId } = await supabaseAdmin
        .from('bookings')
        .select('id, user_id')
        .eq('id', order_id)
        .single()

      if (byId) {
        bookingId = byId.id
        await supabaseAdmin
          .from('bookings')
          .update(updateData)
          .eq('id', bookingId)
      }
    } else if (booking) {
      bookingId = booking.id
      await supabaseAdmin
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)
    }

    // 4) Increment rental_count jika payment berhasil
    if (bookingId && (transaction_status === 'capture' || transaction_status === 'settlement')) {
      await incrementRentalCount(bookingId)
    }

    return NextResponse.json({ message: 'Webhook received and processed' }, { status: 200 })
  } catch (error) {
    console.error('[webhook] Error processing webhook:', error)
    return NextResponse.json({ error: 'Error processing webhook' }, { status: 500 })
  }
}