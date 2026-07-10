'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Phone, Mail } from 'lucide-react'

export function CTA() {
  return (
    <section className="relative overflow-hidden py-16 md:py-28 bg-gradient-to-r from-forest via-forest-dark to-forest-light text-cream">
      {/* Decorative background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-72 h-72 md:w-96 md:h-96 bg-gold rounded-full mix-blend-multiply filter blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 md:w-96 md:h-96 bg-gold rounded-full mix-blend-multiply filter blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          
          {/* Left Content */}
          <div className="space-y-4 md:space-y-6">
            <h2 className="text-3xl md:text-5xl font-bold leading-tight">
              Siap untuk Petualangan Berikutnya?
            </h2>
            <p className="text-xs md:text-lg text-cream/90 leading-relaxed">
              Jangan biarkan kurangnya peralatan menghalangi petualangan Anda. Dengan Habema, semua kebutuhan outdoor Anda tersedia dengan harga terjangkau.
            </p>

            {/* Fitur List - Text XS Mobile Optimized */}
            <div className="pt-2 md:pt-4 space-y-3 md:space-y-4">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-9 h-9 md:w-12 md:h-12 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-lg md:text-2xl">🏃</span>
                </div>
                <div>
                  <h4 className="text-xs md:text-base font-bold">Cepat & Mudah</h4>
                  <p className="text-[10px] md:text-sm text-cream/80">Proses booking hanya butuh 5 menit</p>
                </div>
              </div>

              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-9 h-9 md:w-12 md:h-12 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-lg md:text-2xl">🔒</span>
                </div>
                <div>
                  <h4 className="text-xs md:text-base font-bold">Aman & Terpercaya</h4>
                  <p className="text-[10px] md:text-sm text-cream/80">Verifikasi identitas dan asuransi penuh</p>
                </div>
              </div>

              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-9 h-9 md:w-12 md:h-12 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-lg md:text-2xl">💰</span>
                </div>
                <div>
                  <h4 className="text-xs md:text-base font-bold">Harga Terbaik</h4>
                  <p className="text-[10px] md:text-sm text-cream/80">Garansi harga terendah atau kami kembalikan selisihnya</p>
                </div>
              </div>
            </div>

            {/* Tombol Action */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                size="sm"
                className="bg-gold text-forest hover:bg-gold-light font-bold text-xs md:text-sm py-5 md:py-6"
                asChild
              >
                <Link href="/catalog">
                  Mulai Sekarang
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-cream/30 text-cream hover:bg-cream/10 text-xs md:text-sm py-5 md:py-6"
                asChild
              >
                <Link href="/contact">
                  Hubungi Kami
                </Link>
              </Button>
            </div>
          </div>

          {/* Right Content - Contact Cards (Responsive Grid) */}
          {/* Menggunakan sm:grid-cols-2 agar di tablet/layar tanggung tidak memakan space ke bawah terlalu panjang */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            
            {/* Telepon */}
            <div className="bg-white/10 backdrop-blur-sm border border-cream/20 rounded-xl p-4 md:p-6 hover:bg-white/15 transition-all">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="w-9 h-9 md:w-12 md:h-12 bg-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h4 className="text-sm font-bold mb-0.5 md:mb-1">Telepon</h4>
                  <p className="text-xs md:text-sm text-cream/90">+62 812 3456 7890</p>
                  <p className="text-[10px] md:text-xs text-cream/70 mt-0.5">Senin - Minggu 08:00 - 20:00 WIB</p>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="bg-white/10 backdrop-blur-sm border border-cream/20 rounded-xl p-4 md:p-6 hover:bg-white/15 transition-all">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="w-9 h-9 md:w-12 md:h-12 bg-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h4 className="text-sm font-bold mb-0.5 md:mb-1">Email</h4>
                  <p className="text-xs md:text-sm text-cream/90">info@habema.id</p>
                  <p className="text-[10px] md:text-xs text-cream/70 mt-0.5">Kami akan merespon dalam 24 jam</p>
                </div>
              </div>
            </div>

            {/* Lokasi - Diatur col-span penuh di mobile, kembali normal di grid desktop */}
            <div className="bg-white/10 backdrop-blur-sm border border-cream/20 rounded-xl p-4 md:p-6 hover:bg-white/15 transition-all sm:col-span-2">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="w-9 h-9 md:w-12 md:h-12 bg-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-lg md:text-2xl">📍</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold mb-0.5 md:mb-1">Lokasi</h4>
                  <p className="text-xs md:text-sm text-cream/90 leading-relaxed">
                    Jl. Cihanjuang No.71, Cihanjuang Rahayu, Kec. Parongpong, Kabupaten Bandung Barat, Jawa Barat 40559
                  </p>
                  <p className="text-[10px] md:text-xs text-cream/70 mt-1">Toko fisik tersedia untuk kunjungan</p>
                </div>
              </div>
            </div>

            {/* Chat WhatsApp */}
            <div className="bg-white/10 backdrop-blur-sm border border-cream/20 rounded-xl p-4 md:p-6 hover:bg-white/15 transition-all sm:col-span-2">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="w-9 h-9 md:w-12 md:h-12 bg-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-lg md:text-2xl">💬</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold mb-0.5 md:mb-1">Chat WhatsApp</h4>
                  <p className="text-xs md:text-sm text-cream/90">+62 812 3456 7890</p>
                  <p className="text-[10px] md:text-xs text-cream/70 mt-0.5">Respons cepat</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}