import { NextRequest, NextResponse } from 'next/server'
import {
  createMidtransTransaction,
  generateOrderId,
  isMidtransConfigured,
} from '@/lib/midtrans'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const isProduction = process.env.MIDTRANS_PRODUCTION === 'true'
// Mock pembayaran HANYA boleh aktif di non-produksi dan dengan flag eksplisit.
const allowMock = !isProduction && process.env.MIDTRANS_ALLOW_MOCK === 'true'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Gunakan host dari request agar callback URL sesuai lingkungan saat ini
    const proto = request.headers.get('x-forwarded-proto') || 'http'
    const host = request.headers.get('host') || 'localhost:3000'
    const baseUrl = `${proto}://${host}`
    const { bookingId, customerDetails } = body

    if (!bookingId) {
      return NextResponse.json(
        { error: 'bookingId wajib dikirim' },
        { status: 400 }
      )
    }

    // 1) Muat booking dari DB (sumber kebenaran, bukan dari client)
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('id, rental_days, delivery_cost, delivery_option, status')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking tidak ditemukan' },
        { status: 404 }
      )
    }

    // 2) Muat item booking
    const { data: items, error: itemsError } = await supabaseAdmin
      .from('booking_items')
      .select('equipment_id, quantity')
      .eq('booking_id', bookingId)

    if (itemsError || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Item booking tidak ditemukan' },
        { status: 404 }
      )
    }

    // 3) Ambil harga resmi dari tabel equipment
    const equipmentIds = items.map((it) => it.equipment_id)
    const { data: equipment, error: equipmentError } = await supabaseAdmin
      .from('equipment')
      .select('id, name, price_per_night, category_id')
      .in('id', equipmentIds)

    if (equipmentError || !equipment) {
      return NextResponse.json(
        { error: 'Gagal memuat data harga' },
        { status: 500 }
      )
    }

    const priceMap = new Map(
      equipment.map((e) => [e.id, e])
    )

    const rentalDays = Number(booking.rental_days) || 1

    // 4) Hitung ulang gross_amount sepenuhnya di server
    const itemDetails: Array<{
      id: string
      name: string
      price: number
      quantity: number
      category: string
    }> = []

    let subtotal = 0
    for (const it of items) {
      const eq = priceMap.get(it.equipment_id)
      if (!eq) {
        return NextResponse.json(
          { error: 'Equipment tidak valid pada booking' },
          { status: 400 }
        )
      }
      const qty = Number(it.quantity) || 0
      const unitPriceForRental = Number(eq.price_per_night) * rentalDays
      subtotal += unitPriceForRental * qty
      itemDetails.push({
        id: String(eq.id),
        name: eq.name,
        price: Math.round(unitPriceForRental), // harga per unit untuk seluruh durasi
        quantity: qty,
        category: 'Equipment',
      })
    }

    const deliveryCost =
      booking.delivery_option === 'delivery'
        ? Math.max(0, Number(booking.delivery_cost) || 0)
        : 0

    if (deliveryCost > 0) {
      itemDetails.push({
        id: 'delivery',
        name: 'Biaya Pengantaran',
        price: Math.round(deliveryCost),
        quantity: 1,
        category: 'Delivery',
      })
    }

    const grossAmount = Math.round(subtotal + deliveryCost)

    if (grossAmount <= 0) {
      return NextResponse.json(
        { error: 'Total pembayaran tidak valid' },
        { status: 400 }
      )
    }

    // 5) Buat order id dan (best-effort) simpan ke booking agar webhook bisa
    // mencocokkan. Kolom midtrans_order_id/payment_status ditambahkan via
    // migrasi SQL; bila belum ada, JANGAN gagalkan transaksi — lanjutkan saja
    // supaya pembayaran tetap bisa diproses.
    const orderId = generateOrderId()
    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({ midtrans_order_id: orderId, payment_status: 'pending' })
      .eq('id', bookingId)

    if (updateError) {
      console.warn(
        '[create-transaction] Gagal menyimpan order id ke booking ' +
          '(kolom midtrans_order_id/payment_status mungkin belum ada — jalankan migrasi SQL). ' +
          'Melanjutkan tanpa memblokir pembayaran. Detail:',
        updateError.message,
      )
    }

    // 6) Jika Midtrans tidak terkonfigurasi
    if (!isMidtransConfigured()) {
      if (allowMock) {
        return NextResponse.json({
          success: true,
          orderId,
          token: 'mock-token-' + orderId,
          redirect_url: `${baseUrl}/payment/finish?order_id=${orderId}`,
          mock: true,
        })
      }
      return NextResponse.json(
        { error: 'Payment system not configured.' },
        { status: 500 }
      )
    }

    const transactionData = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      item_details: itemDetails,
      customer_details: {
        first_name: customerDetails?.firstName || 'Customer',
        last_name: customerDetails?.lastName || '',
        email: customerDetails?.email || 'noemail@habema.local',
        phone: customerDetails?.phone || '',
      },
      callbacks: {
        finish: `${baseUrl}/payment/finish`,
        error: `${baseUrl}/payment/error`,
        pending: `${baseUrl}/payment/pending`,
      },
    }

    const result = await createMidtransTransaction(transactionData)

    if (result.success) {
      return NextResponse.json({
        success: true,
        orderId,
        token: result.token,
        redirect_url: result.redirect_url,
      })
    }

    return NextResponse.json(
      { error: 'Payment processing failed. Please try again.' },
      { status: 500 }
    )
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
