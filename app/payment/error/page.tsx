'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertTriangle, ArrowLeft, RefreshCw, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function PaymentErrorPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleRetryPayment = () => {
    router.push('/payment')
  }

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
          <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-semibold text-stone-900 tracking-tight mb-2">
            Pembayaran Gagal
          </h1>
          <p className="text-sm text-stone-500 max-w-md mx-auto">
            Terjadi kesalahan saat memproses pembayaran Anda. Silakan coba lagi atau pilih metode pembayaran lain.
          </p>
        </div>

        <Card className="rounded-2xl border border-stone-200 shadow-none bg-white p-8 max-w-md mx-auto">
          <div className="text-center space-y-6">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-widest text-stone-400 mb-2">
                Status Pembayaran
              </h3>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-sm font-medium text-red-700">Gagal</span>
              </div>
            </div>

            <div className="text-sm text-stone-600 leading-relaxed">
              <p className="mb-3">
                Pembayaran tidak dapat diproses. Hal ini bisa disebabkan oleh:
              </p>
              <ul className="text-left space-y-1 text-stone-500">
                <li>• Kartu kredit tidak valid</li>
                <li>• Saldo e-wallet tidak mencukupi</li>
                <li>• Koneksi internet terputus</li>
                <li>• Batas waktu pembayaran habis</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleRetryPayment}
                className="w-full h-11 bg-emerald-700 hover:bg-emerald-800 rounded-xl text-white font-medium"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Coba Pembayaran Lagi
              </Button>

              <Button
                variant="outline"
                asChild
                className="w-full h-11 rounded-xl border-stone-300 text-stone-600 hover:bg-stone-50"
              >
                <Link href="/catalog">Pilih Produk Lain</Link>
              </Button>
            </div>
          </div>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-xs text-stone-400 mb-2">
            Butuh bantuan? Hubungi tim support kami:
          </p>
          <div className="space-y-1">
            <p className="text-xs text-stone-500">WhatsApp: 0812-3456-7890</p>
            <p className="text-xs text-stone-500">Email: support@habema.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}
