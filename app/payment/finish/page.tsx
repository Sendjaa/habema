'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function PaymentFinishPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    setMounted(true)
    
    // Get transaction result from URL params
    const orderId = searchParams.get('order_id')
    const statusCode = searchParams.get('status_code')
    const transactionStatus = searchParams.get('transaction_status')

    console.log('Payment result:', { orderId, statusCode, transactionStatus })

    // Simulate processing payment result
    setTimeout(() => {
      setIsProcessing(false)
      // Redirect to order confirmation after successful payment
      router.push('/order-confirmation')
    }, 2000)
  }, [searchParams, router])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="border-b border-stone-200 bg-white px-6 py-4">
        <div className="max-w-4xl mx-auto">
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

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
            {isProcessing ? (
              <Loader2 className="w-8 h-8 text-emerald-700 animate-spin" strokeWidth={1.5} />
            ) : (
              <CheckCircle className="w-8 h-8 text-emerald-700" strokeWidth={1.5} />
            )}
          </div>
          <h1 className="text-3xl font-semibold text-stone-900 tracking-tight mb-2">
            {isProcessing ? 'Memproses Pembayaran' : 'Pembayaran Berhasil'}
          </h1>
          <p className="text-sm text-stone-500 max-w-md mx-auto">
            {isProcessing 
              ? 'Sedang memverifikasi status pembayaran Anda...'
              : 'Pembayaran Anda telah berhasil diverifikasi. Mengalihkan ke halaman konfirmasi...'
            }
          </p>
        </div>

        <Card className="rounded-2xl border border-stone-200 shadow-none bg-white p-8 max-w-md mx-auto">
          <div className="text-center space-y-6">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-widest text-stone-400 mb-2">
                Status Pembayaran
              </h3>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
                <div className={`w-2 h-2 bg-emerald-500 rounded-full ${isProcessing ? 'animate-pulse' : ''}`} />
                <span className="text-sm font-medium text-emerald-700">
                  {isProcessing ? 'Processing' : 'Success'}
                </span>
              </div>
            </div>

            <div className="text-sm text-stone-600 leading-relaxed">
              <p>
                {isProcessing 
                  ? 'Mohon tunggu sebentar sementara kami memverifikasi pembayaran Anda.'
                  : 'Terima kasih! Pembayaran Anda telah berhasil diproses.'
                }
              </p>
            </div>

            {!isProcessing && (
              <div className="space-y-3">
                <Button
                  asChild
                  className="w-full h-11 bg-emerald-700 hover:bg-emerald-800 rounded-xl text-white font-medium"
                >
                  <Link href="/order-confirmation">
                    Lihat Detail Pesanan
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  asChild
                  className="w-full h-11 rounded-xl border-stone-300 text-stone-600 hover:bg-stone-50"
                >
                  <Link href="/orders">Riwayat Pesanan</Link>
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
