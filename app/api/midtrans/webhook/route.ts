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

    // 3) Update booking di database — dengan guard idempotensi.
    // Midtrans mengirim notifikasi berulang (retry). Agar efek samping
    // (status paid + increment rental_count) hanya terjadi SEKALI,
    // update sukses memakai kondisi atomik `payment_status <> paid`
    // (compare-and-swap). Jika dua notifikasi datang bersamaan, hanya
    // satu yang berhasil meng-update baris (RETURNING), yang lain tidak
    // mendapat baris dan diabaikan → rental_count tidak pernah ganda.
    const successEvents = ['capture', 'settlement']
    const isSuccess = successEvents.includes(transaction_status)

    let bookingId: string | null = null

    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq('midtrans_order_id', order_id)
      .maybeSingle()

    if (!booking && fetchError) {
      console.warn('[webhook] Booking not found for order_id:', order_id, '- trying by id')
    }

    if (!booking) {
      const { data: byId } = await supabaseAdmin
        .from('bookings')
        .select('id')
        .eq('id', order_id)
        .maybeSingle()

      if (byId) {
        bookingId = byId.id
      }
    } else {
      bookingId = booking.id
    }

    if (bookingId) {
      if (isSuccess) {
        const { data: updated, error: updateErr } = await supabaseAdmin
          .from('bookings')
          .update({
            payment_status: 'paid',
            status: bookingStatus,
            ...(payment_type ? { payment_method: payment_type } : {}),
          })
          .eq('id', bookingId)
          .neq('payment_status', 'paid')
          .select('id')
          .maybeSingle()

        if (updateErr) {
          console.error('[webhook] Gagal update booking paid:', updateErr.message)
        } else if (updated) {
          console.log('[webhook] Booking', bookingId, 'ditandai paid (pertama kali)')
          // Efek samping HANYA di sini — tepat sekali per booking.
          await incrementRentalCount(bookingId)
        } else {
          console.log('[webhook] Booking', bookingId, 'sudah berstatus paid, dilewati (idempotent)')
        }
      } else if (transaction_status === 'refund') {
        // ── Refund: transisi lanjut yang sah dari paid → refunded ──
        // Nilai status idempoten; boleh menimpa paid. Tidak meng-increment.
        await supabaseAdmin
          .from('bookings')
          .update({
            payment_status: 'refunded',
            status: bookingStatus || 'cancelled',
            ...(payment_type ? { payment_method: payment_type } : {}),
          })
          .eq('id', bookingId)
      } else {
        // ── Status lain (pending/deny/cancel/expire) ──
        // Jangan pernah menimpa booking yang sudah final (paid/refunded),
        // sehingga notifikasi lama tidak menurunkan status.
        const { data: updated, error: updateErr } = await supabaseAdmin
          .from('bookings')
          .update({
            payment_status: paymentStatus,
            ...(bookingStatus ? { status: bookingStatus } : {}),
            ...(payment_type ? { payment_method: payment_type } : {}),
          })
          .eq('id', bookingId)
          .or(
            'payment_status.is.null,payment_status.eq.pending,payment_status.eq.failed,payment_status.eq.cancelled,payment_status.eq.expired,payment_status.eq.unknown'
          )
          .select('id')
          .maybeSingle()

        if (updateErr) {
          console.error('[webhook] Gagal update booking:', updateErr.message)
        } else if (!updated) {
          console.log('[webhook] Booking', bookingId, 'sudah final, status', transaction_status, 'dilewati')
        }
      }
    }

    // ── SHOP ORDERS ──
    // Order shop menggunakan kolom `order_id` (format SHOP-...), bukan uuid id.
    // Webhook ini harus mengupdate shop_orders juga, dengan idempotensi
    // compare-and-swap seperti booking agar stock tidak terpotong ganda.
    const { data: shopOrder } = await (supabaseAdmin as any)
      .from('shop_orders')
      .select('id')
      .eq('order_id', order_id)
      .maybeSingle()

    if (shopOrder) {
      const shopId = shopOrder.id
      if (isSuccess) {
        // Payment sukses (pertama kali) — update status + potong stok sekali
        const { data: updatedShop, error: shopUpdateErr } = await (supabaseAdmin as any)
          .from('shop_orders')
          .update({
            payment_status: 'paid',
            status: 'confirmed',
            ...(payment_type ? { payment_method: payment_type } : {}),
          })
          .eq('id', shopId)
          .neq('payment_status', 'paid')
          .select('id')
          .maybeSingle()

        if (shopUpdateErr) {
          console.error('[webhook] Gagal update shop_order paid:', shopUpdateErr.message)
        } else if (updatedShop) {
          console.log('[webhook] Shop order', shopId, 'ditandai paid (pertama kali)')
          // Potong stok & naikkan sold_count — hanya sekali (di atas sudah idempotent)
          const { data: shopItems } = await (supabaseAdmin as any)
            .from('shop_order_items')
            .select('product_id, quantity')
            .eq('order_id', shopId)

          for (const si of shopItems || []) {
            const { data: prod } = await (supabaseAdmin as any)
              .from('shop_products')
              .select('stock, sold_count')
              .eq('id', si.product_id)
              .maybeSingle()
            if (!prod) continue
            await (supabaseAdmin as any)
              .from('shop_products')
              .update({
                stock: Math.max(0, (Number(prod.stock) || 0) - Number(si.quantity)),
                sold_count: (Number(prod.sold_count) || 0) + Number(si.quantity),
              })
              .eq('id', si.product_id)
          }
        } else {
          console.log('[webhook] Shop order', shopId, 'sudah paid, dilewati (idempotent)')
        }
      } else if (transaction_status === 'refund') {
        await (supabaseAdmin as any)
          .from('shop_orders')
          .update({
            payment_status: 'refunded',
            status: 'cancelled',
            ...(payment_type ? { payment_method: payment_type } : {}),
          })
          .eq('id', shopId)
      } else {
        // pending/deny/cancel/expire — jangan menimpa status yang sudah final
        const { data: updatedShop, error: shopUpdateErr } = await (supabaseAdmin as any)
          .from('shop_orders')
          .update({
            payment_status: paymentStatus,
            ...(bookingStatus ? { status: bookingStatus } : {}),
            ...(payment_type ? { payment_method: payment_type } : {}),
          })
          .eq('id', shopId)
          .or(
            'payment_status.is.null,payment_status.eq.pending,payment_status.eq.failed,payment_status.eq.cancelled,payment_status.eq.expired,payment_status.eq.unknown,payment_status.eq.cod'
          )
          .select('id')
          .maybeSingle()

        if (shopUpdateErr) {
          console.error('[webhook] Gagal update shop_order:', shopUpdateErr.message)
        } else if (!updatedShop) {
          console.log('[webhook] Shop order', shopId, 'sudah final, status', transaction_status, 'dilewati')
        }
      }
    }

    return NextResponse.json({ message: 'Webhook received and processed' }, { status: 200 })
  } catch (error) {
    console.error('[webhook] Error processing webhook:', error)
    return NextResponse.json({ error: 'Error processing webhook' }, { status: 500 })
  }
}