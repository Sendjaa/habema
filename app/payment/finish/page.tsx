'use client'

import { useEffect, useState, Suspense } from 'react'

// Force dynamic rendering to prevent prerendering errors
export const dynamic = 'force-dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

function PaymentFinishContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)
  const [status, setStatus] = useState<'loading' | 'success' | 'pending' | 'failed'>('loading')

  useEffect(() => {
    setMounted(true)

    const orderId = searchParams.get('order_id')
    const statusCode = searchParams.get('status_code')
    const transactionStatus = searchParams.get('transaction_status')

    console.log('Payment result:', { orderId, statusCode, transactionStatus })

    if (!orderId) {
      setStatus('failed')
      return
       }

    // Verifikasi status dari database
    const verifyPayment = async () => {
      try {
        const { data: booking, error } = await supabase
          .from('bookings')
          .select('payment_status, status')
          .eq('midtrans_order_id', orderId)
          .single()

        if (error || !booking) {
          // Fallback: cek dari URL params
          if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
            setStatus('success')
            setTimeout(() => router.push('/order-confirmation'), 2000)
          } else if (transactionStatus === 'pending') {
            setStatus('pending')
          } else {
            setStatus('failed')
          }
          return
        }

        if (booking.payment_status === 'paid') {
          setStatus('success')
          setTimeout(() => router.push('/order-confirmation'), 2000)
        } else if (booking.payment_status === 'pending') {
          setStatus('pending')
        } else if (booking.payment_status === 'failed') {
          setStatus('failed')
        } else {
          // Belum ada update dari webhook, cek URL params
          if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
            setStatus('success')
            setTimeout(() => router.push('/order-confirmation'), 2000)
          } else {
            setStatus('pending')
          }
        }
      } catch {
        // Fallback sederhana
        if (statusCode === '200' || transactionStatus === 'settlement') {
          setStatus('success')
          setTimeout(() => router.push('/order-confirmation'), 2000)
        } else {
          setStatus('pending')
        }
      }
    }

    // Tunggu sebentar untuk beri waktu webhook diproses
    const timer = setTimeout(verifyPayment, 1500)
    return () => clearTimeout(timer)
  }, [searchParams, router])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#F1EFE8] flex items-center justify-center">
        <div className="text-stone-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F1EFE8] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white border-[#D3D1C7] shadow-lg">
        <div className="p-8 text-center">
          {status === 'loading' && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <Loader2 className="w-16 h-16 text-emerald-600 animate-spin" />
              </div>
              <div>
                <h2
                  className="text-2xl font-semibold text-stone-900 mb-2"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  Memproses Pembayaran
                </h2>
                <p className="text-stone-600">
                  Sedang memverifikasi status pembayaran Anda...
                </p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <CheckCircle className="w-16 h-16 text-emerald-600" />
              </div>
              <div>
                <h2
                  className="text-2xl font-semibold text-stone-900 mb-2"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  Pembayaran Berhasil!
                </h2>
                <p className="text-stone-600 mb-6">
                  Terima kasih! Pembayaran Anda telah berhasil diproses.
                </p>
              </div>

              <div className="space-y-3">
                <Link href="/order-confirmation">
                  <Button className="w-full bg-emerald-700 hover:bg-emerald-800 text-white">
                    Lihat Konfirmasi Pesanan
                  </Button>
                </Link>

                <Link href="/">
                  <Button variant="outline" className="w-full border-[#D3D1C7] text-stone-700 hover:bg-stone-50">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Kembali ke Beranda
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {status === 'pending' && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <Loader2 className="w-16 h-16 text-amber-500 animate-pulse" />
              </div>
              <div>
                <h2
                  className="text-2xl font-semibold text-stone-900 mb-2"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  Pembayaran Sedang Diproses
                </h2>
                <p className="text-stone-600 mb-6">
                  Pembayaran Anda sedang diverifikasi. Silakan cek beberapa saat lagi.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full border-[#D3D1C7] text-stone-700 hover:bg-stone-50"
                  onClick={() => window.location.reload()}
                >
                  <Loader2 className="w-4 h-4 mr-2" />
                  Refresh Status
                </Button>

                <Link href="/">
                  <Button variant="ghost" className="w-full text-stone-600">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Kembali ke Beranda
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {status === 'failed' && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <AlertTriangle className="w-16 h-16 text-red-500" />
              </div>
              <div>
                <h2
                  className="text-2xl font-semibold text-stone-900 mb-2"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  Pembayaran Gagal
                </h2>
                <p className="text-stone-600 mb-6">
                  Pembayaran tidak dapat diproses. Silakan coba lagi atau pilih metode lain.
                </p>
              </div>

              <div className="space-y-3">
                <Link href="/payment">
                  <Button className="w-full bg-emerald-700 hover:bg-emerald-800 text-white">
                    Coba Pembayaran Lagi
                  </Button>
                </Link>

                <Link href="/">
                  <Button variant="outline" className="w-full border-[#D3D1C7] text-stone-700 hover:bg-stone-50">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Kembali ke Beranda
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default function PaymentFinishPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F1EFE8] flex items-center justify-center">
        <div className="text-stone-600">Loading...</div>
      </div>
    }>
      <PaymentFinishContent />
    </Suspense>
  )
}
