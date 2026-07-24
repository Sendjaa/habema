'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Phone, MessageCircle, MapPin } from 'lucide-react'

export function CTA() {
  return (
    <section className="py-16 md:py-24 bg-stone-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-12 items-center">

          {/* Left — Teks + CTA */}
          <div className="lg:col-span-3 space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">
              Mulai Petualangan
            </p>
            <h2 className="text-3xl md:text-5xl font-black text-stone-900 leading-tight">
              Siap untuk<br />
              <span className="italic text-emerald-700">Petualangan Berikutnya?</span>
            </h2>
            <p className="text-sm md:text-base text-stone-500 leading-relaxed max-w-md">
              Sewa perlengkapan outdoor lengkap dengan harga terbaik. Cepat, mudah, dan terpercaya.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                size="lg"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl"
                asChild
              >
                <Link href="/catalog">
                  Mulai Sekarang
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-stone-300 text-stone-700 hover:bg-stone-100 rounded-xl"
                asChild
              >
                <Link href="/contact">
                  Hubungi Kami
                </Link>
              </Button>
            </div>
          </div>

          {/* Right — Kontak minimal */}
          <div className="lg:col-span-2 space-y-3">
            <a
              href="https://wa.me/6283898749357"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 bg-white rounded-xl border border-stone-200 p-4 hover:border-emerald-300 hover:shadow-sm transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-900">Chat WhatsApp</p>
                <p className="text-xs text-stone-500">+62 838 9874 9357</p>
              </div>
            </a>

            <a
              href="tel:+6283898749357"
              className="flex items-center gap-4 bg-white rounded-xl border border-stone-200 p-4 hover:border-emerald-300 hover:shadow-sm transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
                <Phone className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-900">Telepon</p>
                <p className="text-xs text-stone-500">+62 838 9874 9357</p>
              </div>
            </a>

            <div className="flex items-center gap-4 bg-white rounded-xl border border-stone-200 p-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-900">Lokasi</p>
                <p className="text-xs text-stone-500">Jl.Kolonel Masturi, No.176, Lembang, Bandung Barat</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}