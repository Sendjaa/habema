'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Phone, Mail } from 'lucide-react'

export function CTA() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32 bg-gradient-to-r from-forest via-forest-dark to-forest-light text-cream">
      {/* Decorative background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold rounded-full mix-blend-multiply filter blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gold rounded-full mix-blend-multiply filter blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              Siap untuk Petualangan Berikutnya?
            </h2>
            <p className="text-lg text-cream/90">
              Jangan biarkan kurangnya peralatan menghalangi petualangan Anda. Dengan Habema, semua kebutuhan outdoor Anda tersedia dengan harga terjangkau.
            </p>

            <div className="pt-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🏃</span>
                </div>
                <div>
                  <h4 className="font-bold">Cepat & Mudah</h4>
                  <p className="text-sm text-cream/80">Proses booking hanya butuh 5 menit</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🔒</span>
                </div>
                <div>
                  <h4 className="font-bold">Aman & Terpercaya</h4>
                  <p className="text-sm text-cream/80">Verifikasi identitas dan asuransi penuh</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">💰</span>
                </div>
                <div>
                  <h4 className="font-bold">Harga Terbaik</h4>
                  <p className="text-sm text-cream/80">Garansi harga terendah atau kami kembalikan selisihnya</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button
                size="lg"
                className="bg-gold text-forest hover:bg-gold-light font-bold"
                asChild
              >
                <Link href="/catalog">
                  Mulai Sekarang
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-cream/30 text-cream hover:bg-cream/10"
                asChild
              >
                <Link href="/contact">
                  Hubungi Kami
                </Link>
              </Button>
            </div>
          </div>

          {/* Right Content - Contact Cards */}
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur border border-cream/20 rounded-lg p-6 hover:bg-white/15 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h4 className="font-bold mb-1">Telepon</h4>
                  <p className="text-sm text-cream/90">+62 812 3456 7890</p>
                  <p className="text-xs text-cream/70">Senin - Minggu 08:00 - 20:00 WIB</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur border border-cream/20 rounded-lg p-6 hover:bg-white/15 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h4 className="font-bold mb-1">Email</h4>
                  <p className="text-sm text-cream/90">info@habema.id</p>
                  <p className="text-xs text-cream/70">Kami akan merespon dalam 24 jam</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur border border-cream/20 rounded-lg p-6 hover:bg-white/15 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📍</span>
                </div>
                <div>
                  <h4 className="font-bold mb-1">Lokasi</h4>
                  <p className="text-sm text-cream/90">Jl. Cihanjuang No.71, Cihanjuang Rahayu, Kec. Parongpong, Kabupaten Bandung Barat, Jawa Barat 40559</p>
                  <p className="text-xs text-cream/70">Toko fisik tersedia untuk kunjungan</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur border border-cream/20 rounded-lg p-6 hover:bg-white/15 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">💬</span>
                </div>
                <div>
                  <h4 className="font-bold mb-1">Chat WhatsApp</h4>
                  <p className="text-sm text-cream/90">+62 812 3456 7890</p>
                  <p className="text-xs text-cream/70">Respons cepat</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
