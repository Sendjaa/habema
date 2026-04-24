// app/payment/page.tsx
'use client'

import { useCartStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, CreditCard, Smartphone, Building, ArrowRight, Loader2 } from 'lucide-react'

// Load Midtrans Snap script
const loadMidtransScript = () => {
  return new Promise((resolve) => {
    if (window.snap) {
      resolve(window.snap)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://app.midtrans.com/snap/snap.js'
    script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '')
    script.onload = () => resolve(window.snap)
    document.body.appendChild(script)
  })
}

declare global {
  interface Window {
    snap: any
  }
}

export default function PaymentPage() {
  const router = useRouter()
  const setTransaction = useCartStore((state) => state.setTransaction)
  const transaction = useCartStore((state) => state.currentTransaction)
  
  const [selectedMethod, setSelectedMethod] = useState("midtrans")
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Get data from transaction store
  const getTransactionData = () => {
    if (transaction) {
      const itemsArray = Array.isArray(transaction.items) ? transaction.items : [transaction.items]
      const firstItem = itemsArray[0]
      return {
        product: {
          id: firstItem?.id || "default",
          name: firstItem?.name || "Produk Sewa",
          image_url: firstItem?.image_url || "/placeholder.png",
          price: firstItem?.price || 0,
          quantity: firstItem?.quantity || 1,
          category: firstItem?.category || "default"
        },
        duration: transaction.duration || 1,
        total: transaction.totalPrice || 0
      }
    }
    
    // Fallback data
    return {
      product: {
        id: "tent-001",
        name: "Tenda Arpenaz 4.1",
        image_url: "/api/placeholder/150/150", // Use placeholder API
        price: 50000,
        quantity: 1,
        category: "tents"
      },
      duration: 3,
      total: 150000
    }
  }

  const { product: productToRent, duration, total } = getTransactionData()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleMidtransPayment = async () => {
    setIsLoading(true)
    
    try {
      // Load Midtrans Snap
      await loadMidtransScript()
      
      // Create transaction via API
      const response = await fetch('/api/midtrans/create-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [productToRent],
          customerDetails: {
            firstName: 'Customer',
            lastName: 'Habema',
            email: 'customer@habema.com',
            phone: '08123456789',
          },
          totalPrice: total,
        }),
      })

      // Check if response is OK before parsing JSON
      if (!response.ok) {
        console.error('API Response not OK:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('Error response:', errorText)
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text()
        console.error('Non-JSON response:', responseText)
        throw new Error('Invalid response format from server')
      }

      const result = await response.json()

      if (result.success && result.token) {
        // Save transaction data to store
        const dataToSave = {
          items: [productToRent],
          duration: duration,
          days: duration,
          payment: { 
            method: 'Midtrans', 
            orderId: result.orderId,
            token: result.token,
            mockMode: result.mockMode || false
          },
          paymentMethod: 'Midtrans',
          totalPrice: total
        }

        setTransaction(dataToSave)

        // Handle mock mode (development)
        if (result.mockMode) {
          console.log('Using mock payment flow')
          // Simulate payment success after 2 seconds
          setTimeout(() => {
            console.log('Mock payment completed, redirecting to order confirmation')
            router.push('/order-confirmation')
          }, 2000)
          return
        }

        // Open Midtrans Snap popup
        window.snap.pay(result.token, {
          onSuccess: function (result: any) {
            console.log('Payment success:', result)
            router.push('/order-confirmation')
          },
          onPending: function (result: any) {
            console.log('Payment pending:', result)
            router.push('/payment/pending')
          },
          onError: function (result: any) {
            console.log('Payment error:', result)
            setIsLoading(false)
          },
          onClose: function () {
            setIsLoading(false)
          }
        })
      } else {
        console.error('Transaction creation failed:', result.error)
        setIsLoading(false)
        
        // Show user-friendly error
        if (result.error?.includes('Payment service not configured')) {
          alert('Payment gateway sedang dalam setup. Silakan coba lagi nanti atau hubungi admin.')
        } else {
          alert('Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi.')
        }
      }
    } catch (error) {
      console.error('Payment error:', error)
      setIsLoading(false)
    }
  }

  const handleDirectPay = () => {
    const dataToSave = {
      items: [productToRent],
      duration: duration,
      days: duration,
      payment: { method: 'Direct', bank: 'BCA' },
      totalPrice: total
    }

    setTransaction(dataToSave)
    router.push('/order-confirmation')
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Payment Header */}
      <div className="bg-white shadow-sm border-b border-emerald-100">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-emerald-900">Pembayaran Aman</h1>
              <p className="text-emerald-600 mt-1">Lengkapi pembayaran Anda dengan amat dan nyaman</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-emerald-600">Total Pembayaran</div>
              <div className="text-2xl font-bold text-emerald-900">
                Rp {total.toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Payment Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Details */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-emerald-50 border-2 border-emerald-100">
                    {productToRent.image_url && (
                      <Image
                        src={productToRent.image_url}
                        alt={productToRent.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw"
                        className="object-cover"
                        placeholder="blur"
                        blurDataURL="data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='40' height='40' fill='%23e2e8f'/%3E%3C/svg%3E"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-emerald-900">{productToRent.name}</h3>
                    <p className="text-emerald-600">Durasi: {duration} hari sewa</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-emerald-100 text-emerald-700">Tersedia</Badge>
                      <span className="text-sm text-emerald-600">• Rp {productToRent.price.toLocaleString('id-ID')}/hari</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Payment Methods */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-emerald-900 mb-6">Pilih Metode Pembayaran</h2>
                
                <div className="space-y-4">
                  {/* Midtrans Option */}
                  <div
                    onClick={() => setSelectedMethod('midtrans')}
                    className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedMethod === 'midtrans'
                        ? 'border-emerald-500 bg-emerald-50 shadow-md'
                        : 'border-emerald-200 bg-white hover:border-emerald-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                          <CreditCard className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-emerald-900">Pembayaran Digital</h4>
                          <p className="text-emerald-600">Kartu Kredit, GoPay, ShopeePay, Virtual Account</p>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedMethod === 'midtrans' ? 'border-emerald-500 bg-emerald-500' : 'border-emerald-300'
                      }`}>
                        {selectedMethod === 'midtrans' && <Check className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge className="bg-white text-emerald-700 border border-emerald-200">Visa</Badge>
                      <Badge className="bg-white text-emerald-700 border border-emerald-200">Mastercard</Badge>
                      <Badge className="bg-white text-emerald-700 border border-emerald-200">GoPay</Badge>
                      <Badge className="bg-white text-emerald-700 border border-emerald-200">ShopeePay</Badge>
                      <Badge className="bg-white text-emerald-700 border border-emerald-200">BCA VA</Badge>
                    </div>
                    {selectedMethod === 'midtrans' && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-emerald-500 text-white text-xs">Pilihan Terbaik</Badge>
                      </div>
                    )}
                  </div>

                  {/* Direct Transfer Option */}
                  <div
                    onClick={() => setSelectedMethod('direct')}
                    className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedMethod === 'direct'
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-emerald-200 bg-white hover:border-emerald-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                          <Building className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-emerald-900">Transfer Bank</h4>
                          <p className="text-emerald-600">BCA, Mandiri, BNI, BRI</p>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedMethod === 'direct' ? 'border-blue-500 bg-blue-500' : 'border-emerald-300'
                      }`}>
                        {selectedMethod === 'direct' && <Check className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Button */}
                <div className="mt-8">
                  <Button
                    onClick={selectedMethod === 'midtrans' ? handleMidtransPayment : handleDirectPay}
                    disabled={isLoading}
                    className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-2xl font-semibold text-white shadow-lg transition-all transform hover:scale-[1.02]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                        Memproses Pembayaran...
                      </>
                    ) : (
                      <>
                        <span>Bayar Sekarang</span>
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                  
                  <div className="mt-4 text-center">
                    <p className="text-sm text-emerald-600">
                      🔒 Pembayaran Anda aman dan terenkripsi
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              {/* Order Summary */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                <div className="p-6">
                  <h3 className="font-semibold text-emerald-900 mb-4">Detail Pesanan</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-600">Produk</span>
                      <span className="font-medium text-emerald-900">{productToRent.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-600">Durasi</span>
                      <span className="font-medium text-emerald-900">{duration} hari</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-600">Harga per hari</span>
                      <span className="font-medium text-emerald-900">Rp {productToRent.price.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="border-t border-emerald-200 pt-3">
                      <div className="flex justify-between">
                        <span className="font-semibold text-emerald-900">Total</span>
                        <span className="text-xl font-bold text-emerald-900">Rp {total.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Security Badge */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                <div className="p-6">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CreditCard className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h4 className="font-semibold text-emerald-900 mb-2">Pembayaran Aman</h4>
                    <p className="text-sm text-emerald-600">
                      Transaksi Anda dilindungi dengan enkripsi SSL 256-bit
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}