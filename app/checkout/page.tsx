'use client'
import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Order, useCartStore } from '@/lib/store'
import { CheckCircle, ArrowLeft, Info, Loader2 } from 'lucide-react'

export default function CheckoutPage() {
  const transaction = useCartStore((state) => state.currentTransaction)
  const addOrder = useCartStore((state) => state.addOrder)
  const clearCart = useCartStore((state) => state.clearCart)
  const [mounted, setMounted] = useState(false)
  const hasSaved = useRef(false)

  const orderId = useMemo(
    () => `HBM-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    []
  )

  useEffect(() => {
    setMounted(true)
    if (transaction && !hasSaved.current) {
      const itemsArray = Array.isArray(transaction.items)
        ? transaction.items
        : [transaction.items]
      const today = new Date()
      const returnDate = new Date()
      returnDate.setDate(today.getDate() + (transaction.duration || 1))

      const newOrder: Order = {
        id: orderId,
        date: today.toLocaleDateString('id-ID'),
        status: 'pending',
        items: itemsArray.map((item: any) => item?.name || 'Unknown Item'),
        pickup_date: today.toISOString().split('T')[0],
        return_date: returnDate.toISOString().split('T')[0],
        total: transaction.totalPrice,
        qr_code: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${orderId}`,
        image_url: itemsArray[0]?.image_url || '/placeholder.png',
      }
      addOrder(newOrder)
      hasSaved.current = true
    }
  }, [transaction, orderId, addOrder])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <Card className="p-10 text-center max-w-sm rounded-2xl shadow-none border border-stone-200">
          <p className="text-stone-500 mb-6 text-sm">Sesi checkout tidak ditemukan.</p>
          <Button asChild className="w-full bg-emerald-800 hover:bg-emerald-900 rounded-xl h-11 text-sm font-medium">
            <Link href="/">Kembali ke Beranda</Link>
          </Button>
        </Card>
      </div>
    )
  }

  const itemData = Array.isArray(transaction.items)
    ? transaction.items
    : [transaction.items]
  const paymentData = transaction.payment
  const total = transaction.totalPrice || 0

  const returnDate = new Date()
  returnDate.setDate(returnDate.getDate() + (transaction.duration || 1))
  const returnDateStr = returnDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      {/* Header strip */}
      <div className="border-b border-stone-200 bg-white px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-stone-500 hover:text-stone-800 hover:bg-stone-100 h-8 px-2 gap-1.5 text-xs font-medium"
          >
            <Link href="/" className="flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali ke Beranda
            </Link>
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Page heading */}
        <div className="mb-10">
          <h1 className="text-3xl font-semibold text-stone-900 tracking-tight">
            Konfirmasi Pesanan
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Pesanan Anda telah berhasil diproses
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main card */}
          <div className="lg:col-span-2">
            <Card className="rounded-2xl border border-stone-200 shadow-none bg-white overflow-hidden">
              {/* Emerald top accent */}
              <div className="h-1 bg-gradient-to-r from-emerald-600 to-teal-500" />

              <div className="p-8 md:p-10">
                {/* Success icon */}
                <div className="flex flex-col items-center text-center mb-8">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-4">
                    <CheckCircle className="w-7 h-7 text-emerald-700 fill-emerald-50" strokeWidth={1.5} />
                  </div>
                  <h2 className="text-2xl font-semibold text-stone-900 tracking-tight">
                    Pesanan Berhasil
                  </h2>
                  <p className="text-sm text-stone-500 mt-1.5 max-w-xs">
                    Simpan ID pesanan Anda untuk pengambilan alat di Basecamp Habema.
                  </p>
                </div>

                {/* Divider */}
                <div className="border-t border-stone-100 mb-6" />

                {/* Order detail block */}
                <div className="max-w-md mx-auto bg-stone-50 border border-stone-200 rounded-xl px-5 py-4 space-y-3 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-xs uppercase tracking-widest text-stone-400 font-medium">
                      ID Pesanan
                    </span>
                    <span className="font-mono text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                      {orderId}
                    </span>
                  </div>
                  <div className="border-t border-stone-200" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-stone-500">Metode Pembayaran</span>
                    <span className="text-sm font-medium text-stone-800">
                      {paymentData?.method || 'Cash'}
                      {paymentData?.bank ? ` – ${paymentData.bank}` : ''}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-sm text-stone-500">Total Dibayar</span>
                    <span className="text-xl font-semibold text-emerald-700 tracking-tight">
                      Rp {total.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Info box */}
                <div className="max-w-md mx-auto border-l-2 border-emerald-400 pl-4 pr-3 py-3 bg-stone-50 rounded-r-lg mb-7">
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {paymentData?.method === 'Transfer Bank'
                      ? 'Harap kirim bukti transfer ke WhatsApp admin setelah pembayaran. Pesanan akan diproses dalam 15 menit.'
                      : 'Harap tunjukkan halaman ini atau email konfirmasi saat pengambilan di Basecamp Habema.'}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <Button
                    variant="outline"
                    className="flex-1 h-11 rounded-xl text-sm font-medium text-stone-600 border-stone-300 hover:bg-stone-50"
                    asChild
                  >
                    <Link href="/">Beranda</Link>
                  </Button>
                  <Button
                    className="flex-1 h-11 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-medium shadow-none"
                    asChild
                  >
                    <Link href="/orders">Riwayat Pesanan →</Link>
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="rounded-2xl border border-stone-200 shadow-none bg-white p-6 sticky top-24">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-4 pb-4 border-b border-stone-100">
                Ringkasan Sewa
              </h3>

              {/* Items */}
              <div className="space-y-3 mb-4">
                {itemData.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-lg border border-stone-200 bg-stone-50 overflow-hidden flex-shrink-0">
                      <img
                        src={item?.image_url}
                        alt={item?.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800 truncate leading-tight">
                        {item?.name}
                      </p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {item?.quantity} Unit &times; Rp{' '}
                        {item?.price?.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Meta rows */}
              <div className="border-t border-stone-100 pt-4 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-stone-400">Durasi Sewa</span>
                  <span className="text-xs font-semibold text-emerald-700">
                    {transaction.duration} Hari
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-stone-400">Tgl. Kembali</span>
                  <span className="text-xs font-medium text-stone-700">
                    {returnDateStr}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-stone-400">Status Bayar</span>
                  <span className="text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md">
                    Pending
                  </span>
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-stone-200 mt-4 pt-4 flex justify-between items-baseline">
                <span className="text-sm font-semibold text-stone-800">Total</span>
                <span className="text-lg font-semibold text-emerald-700 tracking-tight">
                  Rp {total.toLocaleString('id-ID')}
                </span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}