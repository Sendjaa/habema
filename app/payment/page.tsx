// app/payment/page.tsx
'use client'

import { useCartStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function PaymentPage() {
  const router = useRouter()
  const setTransaction = useCartStore((state) => state.setTransaction)
  
  // Contoh state lokal, pastikan ini diisi sesuai pilihan user di UI
  const [selectedBank, setSelectedBank] = useState("BCA")
  const [method, setMethod] = useState("Transfer Bank")

  // Data ini biasanya datang dari props atau store cart kamu
  const productToRent = {
    name: "Tenda Arpenaz 4.1",
    image_url: "/placeholder-tent.png", // Pastikan path gambar benar
    price: 50000
  }
  const duration = 3
  const total = productToRent.price * duration

  const handlePay = () => {
    const dataToSave = {
      items: [productToRent],
      duration: duration,
      days: duration,
      payment: { method: method, bank: selectedBank },
      paymentMethod: method,
      totalPrice: total
    };

    console.log("Data yang akan disimpan:", dataToSave);

    // Jalankan setTransaction
    setTransaction(dataToSave);

    // Paksa router pindah HANYA setelah kita yakin data tersimpan
    // atau gunakan delay sedikit lebih lama (200ms)
    setTimeout(() => {
      router.push('/checkout');
    }, 300); 
  }

  return (
    <div className="p-10">
      {/* UI Pilihan Pembayaran Kamu */}
      <button 
        onClick={handlePay}
        className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold"
      >
        Konfirmasi Bayar Sekarang
      </button>
    </div>
  )
}