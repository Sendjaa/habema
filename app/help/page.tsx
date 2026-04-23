'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Search,
  MessageCircle,
  Mail,
  BookOpen,
  Truck,
  ShieldCheck,
  CreditCard,
  ChevronDown,
  ChevronUp,
  ArrowLeft
} from 'lucide-react'

// --- Data FAQ ---
const FAQS = [
  {
    category: 'Pemesanan',
    icon: <BookOpen className="w-4 h-4" />,
    questions: [
      { q: "Bagaimana cara menyewa alat di Habema?", a: "Pilih alat di katalog, tentukan tanggal sewa, dan selesaikan pembayaran. Admin akan memverifikasi pesanan Anda melalui WhatsApp atau Email." },
      { q: "Berapa lama durasi minimal sewa?", a: "Durasi minimal sewa adalah 24 jam (1 hari). Pengembalian lebih awal tetap dihitung 1 hari." },
      { q: "Dapatkah saya membatalkan pesanan?", a: "Pembatalan dapat dilakukan maksimal H-1 sebelum jadwal sewa untuk pengembalian dana penuh." }
    ]
  },
  {
    category: 'Pengiriman & Pengambilan',
    icon: <Truck className="w-4 h-4" />,
    questions: [
      { q: "Apakah ada layanan antar-jemput?", a: "Ya, kami melayani antar-jemput untuk wilayah Bandung & KBB. Biaya ongkir akan dihitung otomatis saat checkout berdasarkan jarak." },
      { q: "Bisa ambil langsung ke gudang?", a: "Tentu. Anda bisa memilih opsi 'Ambil Sendiri' saat checkout tanpa dikenakan biaya pengiriman." }
    ]
  },
  {
    category: 'Pembayaran',
    icon: <CreditCard className="w-4 h-4" />,
    questions: [
      { q: "Metode pembayaran apa yang tersedia?", a: "Kami mendukung Transfer Bank (BCA/Mandiri), E-Wallet (GoPay/OVO/Dana), dan QRIS." },
      { q: "Apakah butuh jaminan (Deposit)?", a: "Untuk beberapa alat premium, kami mewajibkan jaminan berupa identitas asli (KTP/SIM) atau deposit uang yang akan dikembalikan saat alat kembali." }
    ]
  }
]

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [openIndex, setOpenIndex] = useState<string | null>(null)

  // --- Fungsi WhatsApp Support ---
  const handleWhatsAppSupport = () => {
    const phone = "628123456789" // Ganti dengan nomor WhatsApp Admin Anda
    const message = encodeURIComponent("Halo Admin Habema, saya butuh bantuan mengenai sewa alat.")
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank')
  }

  // --- Logika Search FAQ ---
  const filteredFaqs = useMemo(() => {
    if (!searchQuery) return FAQS
    
    return FAQS.map(cat => ({
      ...cat,
      questions: cat.questions.filter(faq => 
        faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.a.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(cat => cat.questions.length > 0)
  }, [searchQuery])

  const toggleFaq = (id: string) => {
    setOpenIndex(openIndex === id ? null : id)
  }

  return (
    <div className="min-h-screen bg-[#F1EFE8] font-body pb-20">
      {/* Header Mobile / Navigation */}
      <div className="bg-[#085041] px-4 py-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="text-white hover:bg-white/10 rounded-full">
          <Link href="/account"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <span className="text-white font-medium text-sm">Pusat Bantuan</span>
      </div>

      {/* Hero Section */}
      <div className="bg-[#085041] pt-8 pb-20 px-4 text-center">
        <h1 className="text-3xl md:text-4xl font-semibold text-white mb-4" style={{ fontFamily: "'Fraunces', serif" }}>
          Ada yang bisa kami bantu?
        </h1>
        <p className="text-[#9FE1CB] mb-8 max-w-lg mx-auto text-sm">
          Temukan jawaban cepat atau hubungi tim support kami jika ada kendala.
        </p>
        
        {/* Search Bar - Live Filter */}
        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <Input 
            className="w-full h-14 pl-12 pr-4 rounded-2xl border-none shadow-2xl text-stone-900 bg-white focus-visible:ring-emerald-500"
            placeholder="Cari pertanyaan Anda di sini..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 -mt-10">
        
        {/* Contact Quick Access */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <Card 
            onClick={handleWhatsAppSupport}
            className="p-6 bg-white border-stone-200 rounded-2xl shadow-sm flex items-start gap-4 hover:border-emerald-300 transition-all cursor-pointer active:scale-95"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <MessageCircle className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 text-sm md:text-base">WhatsApp Support</h3>
              <p className="text-[11px] text-stone-500 mb-2">Respon cepat (Setiap hari 08:00 - 21:00)</p>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Chat Sekarang &rarr;</span>
            </div>
          </Card>

          <Card className="p-6 bg-white border-stone-200 rounded-2xl shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Mail className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 text-sm md:text-base">Email Bantuan</h3>
              <p className="text-[11px] text-stone-500 mb-1">Untuk keluhan teknis atau kerja sama</p>
              <p className="text-xs font-bold text-stone-700 mt-1">supporthabema@gmail.id</p>
            </div>
          </Card>
        </div>

        {/* FAQ Results */}
        <div className="space-y-8">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-semibold text-stone-900" style={{ fontFamily: "'Fraunces', serif" }}>
              {searchQuery ? `Hasil pencarian: "${searchQuery}"` : 'Pertanyaan Populer'}
            </h2>
          </div>

          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-stone-400 text-sm italic">Maaf, pertanyaan "{searchQuery}" tidak ditemukan.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredFaqs.map((cat, catIdx) => (
                <div key={catIdx} className="space-y-3">
                  <div className="flex items-center gap-2 text-stone-400 px-1">
                    {cat.icon}
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{cat.category}</span>
                  </div>
                  
                  <div className="space-y-2">
                    {cat.questions.map((faq, faqIdx) => {
                      const id = `${catIdx}-${faqIdx}`;
                      const isOpen = openIndex === id;
                      return (
                        <Card key={faqIdx} className="border-stone-200 shadow-none rounded-xl overflow-hidden transition-all duration-200">
                          <button 
                            onClick={() => toggleFaq(id)}
                            className={`w-full flex items-center justify-between p-4 text-left transition-colors ${isOpen ? 'bg-emerald-50/30' : 'hover:bg-stone-50'}`}
                          >
                            <span className="text-sm font-medium text-stone-800 pr-4">{faq.q}</span>
                            {isOpen ? <ChevronUp className="w-4 h-4 text-emerald-700" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
                          </button>
                          {isOpen && (
                            <div className="px-4 pb-4 text-sm text-stone-500 leading-relaxed pt-2 border-t border-emerald-50/50">
                              {faq.a}
                            </div>
                          )}
                        </Card>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Footer */}
        <div className="mt-16 text-center border-t border-stone-200 pt-10">
          <div className="inline-flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 mb-4">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Keamanan Data Terjamin</span>
          </div>
          <p className="text-[10px] text-stone-400 leading-relaxed uppercase tracking-widest">
            Habema Rental &copy; 2026. <br/> Bandung, Jawa Barat.
          </p>
        </div>
      </div>
    </div>
  )
}