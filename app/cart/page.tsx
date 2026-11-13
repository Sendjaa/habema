'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ShoppingCart, ArrowLeft, Trash2, Plus, Minus, Calendar } from 'lucide-react'
import { useCartStore } from '@/lib/store'
import { LoginModal } from '@/components/auth/login-modal'
import { supabase } from '@/lib/supabaseClient'

export default function CartPage() {
  const router = useRouter()
  
  const cart = useCartStore((state) => state.items)
  const removeFromCart = useCartStore((state) => state.removeItem)
  const updateItemQuantity = useCartStore((state) => state.updateItemQuantity)
  const clearCart = useCartStore((state) => state.clearCart)
  const setTransaction = useCartStore((state) => state.setTransaction)
  
  const [isClient, setIsClient] = React.useState(false)
  const [duration, setDuration] = React.useState(1)
  const [showLoginModal, setShowLoginModal] = React.useState(false)

  React.useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) return null

  const totalHargaUnit = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
  const totalKeseluruhan = totalHargaUnit * duration

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    // Mengambil data untuk URL (menggunakan item pertama sebagai referensi ID sesuai permintaan)
    const firstItemId = cart[0].id;
    const totalQuantity = cart.reduce((acc, item) => acc + item.quantity, 0);

    // Simpan data lengkap ke transaction store agar halaman booking bisa memproses detailnya
    setTransaction({
      duration: duration,
      days: duration,
      totalPrice: totalKeseluruhan,
      items: cart,
      payment: {
        method: '',
        bank: ''
      }
    });

    // Navigasi ke format: /booking?id=xxx&quantity=yyy
    router.push(`/booking?id=${firstItemId}&quantity=${totalQuantity}`);
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-4">
        <Card className="p-12 bg-white border border-forest/10 max-w-md text-center rounded-2xl shadow-sm">
          <div className="mb-6"><ShoppingCart className="w-16 h-16 mx-auto text-forest/20" /></div>
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Keranjang Kosong</h1>
          <p className="text-muted-foreground mb-6">Belum ada item di keranjang Anda.</p>
          <Button className="w-full bg-[#1B4332] text-white font-bold py-6 rounded-xl" asChild>
            <Link href="/catalog_rental"><ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Katalog</Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] py-6 md:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl lg:text-4xl font-bold font-sans text-stone-900">Keranjang Belanja</h1>
          <Button variant="ghost" onClick={clearCart} className="text-red-500 font-bold text-xs">KOSONGKAN</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <Card key={item.id} className="p-5 bg-white border border-forest/5 rounded-2xl">
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100">
                    <Image 
                      src={item.image_url || '/placeholder.svg'} 
                      alt={item.name} 
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw"
                      className="object-cover"
                      placeholder="blur"
                      blurDataURL="data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='40' height='40' fill='%23e2e8f'/%3E%3C/svg%3E"
                    />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-stone-900 text-lg">{item.name}</h3>
                      {item.category && (
                        <span className="text-xs bg-forest/10 text-forest px-2 py-1 rounded-full">
                          {item.category}
                        </span>
                      )}
                    </div>
                    <p className="text-gold font-bold mb-2">Rp {item.price.toLocaleString('id-ID')} <span className="text-[10px] text-forest/40">/hari</span></p>
                    
                    {/* Product Details */}
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {item.description && (
                        <p className="line-clamp-2">{item.description}</p>
                      )}
                      
                      {/* Key Specifications */}
                      <div className="flex flex-wrap gap-3 text-xs">
                        {item.brand && (
                          <span className="bg-slate-100 px-2 py-1 rounded font-medium">
                            {item.brand}
                          </span>
                        )}
                        {item.capacity && (
                          <span className="bg-slate-100 px-2 py-1 rounded">
                            {item.capacity}
                          </span>
                        )}
                        {item.weight_kg && (
                          <span className="bg-slate-100 px-2 py-1 rounded">
                            {item.weight_kg}kg
                          </span>
                        )}
                        {item.dimensions && (
                          <span className="bg-slate-100 px-2 py-1 rounded">
                            {item.dimensions}
                          </span>
                        )}
                        {item.material && (
                          <span className="bg-slate-100 px-2 py-1 rounded">
                            {item.material}
                          </span>
                        )}
                        {item.weather_rating && (
                          <span className="bg-slate-100 px-2 py-1 rounded">
                            {item.weather_rating}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-forest/5 p-1 rounded-xl">
                    <button onClick={() => item.quantity > 1 ? updateItemQuantity(item.id, item.quantity - 1) : removeFromCart(item.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white shadow-sm"><Minus size={14} /></button>
                    <span className="w-6 text-center font-bold">{item.quantity}</span>
                    <button onClick={() => updateItemQuantity(item.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white shadow-sm"><Plus size={14} /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="p-2 text-forest/20 hover:text-red-500"><Trash2 size={20} /></button>
                </div>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-1">
            <Card className="p-6 bg-white border-2 border-gold md:sticky md:top-24 space-y-6 rounded-2xl shadow-xl">
              <h3 className="font-bold text-xl text-stone-900">Ringkasan Sewa</h3>
               
              <div className="bg-forest/5 p-4 rounded-xl space-y-3">
                <label className="text-sm font-bold text-forest flex items-center gap-2">
                  <Calendar size={16} /> Durasi Sewa (Hari)
                </label>
                <div className="flex items-center gap-4">
                  <input 
                    type="number" 
                    min="1" 
                    value={duration}
                    onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full p-2 rounded-lg border-2 border-forest/10 focus:border-gold outline-none font-bold text-center"
                  />
                </div>
              </div>

              <div className="space-y-3 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal Produk</span>
                  <span className="font-bold">Rp {totalHargaUnit.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Durasi</span>
                  <span className="font-bold text-gold">{duration} Hari</span>
                </div>
                <div className="border-t border-forest/10 pt-3 flex justify-between items-center">
                  <span className="text-forest font-bold text-lg">Total</span>
                  <p className="text-2xl font-black text-forest">
                    <span className="text-xs font-bold mr-1 text-gold">Rp</span>
                    {totalKeseluruhan.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                className="w-full bg-[#1B4332] hover:bg-[#143326] font-bold h-12 rounded-lg text-white"
              >
                Sewa Sekarang
              </Button>
            </Card>
          </div>
        </div>
      </div>
      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
      />
    </div>
  )
}