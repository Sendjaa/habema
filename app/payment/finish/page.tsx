'use client'

import { useEffect, useState, Suspense } from 'react'

// Force dynamic rendering to prevent prerendering errors
export const dynamic = 'force-dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

function PaymentFinishContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    setMounted(true)
    
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
      <div className="min-h-screen bg-[#F1EFE8] flex items-center justify-center">
        <div className="text-stone-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F1EFE8] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white border-[#D3D1C7] shadow-lg">
        <div className="p-8 text-center">
          {isProcessing ? (
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
          ) : (
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
