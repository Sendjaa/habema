'use client'

import Link from 'next/link'
import { Facebook, Instagram, } from 'lucide-react'
import Image from 'next/image'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-forest text-cream mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div> 
            <div className="flex items-center gap-2 mb-4">
              <Image src="/images/logo-dark.webp" alt="Habema Logo" width={80} height={80} />
            </div>
            <p className="text-cream/80 text-sm">
              Platform penyewaan peralatan outdoor terpercaya untuk petualangan Anda.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" className="hover:text-gold transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-gold transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              {/* <a href="#" className="hover:text-gold transition-colors">
                <Image src="/tiktok.png" alt="Tiktok" className="rounded-full" width={30} height={30} />  
              </a> */}
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-bold mb-4">Perusahaan</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-gold transition-colors">
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-gold transition-colors">
                  Hubungi Kami
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-gold transition-colors">
                  Karir
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-gold transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-bold mb-4">Produk</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/catalog" className="hover:text-gold transition-colors">
                  Katalog Lengkap
                </Link>
              </li>
              <li>
                <Link href="/bundles" className="hover:text-gold transition-colors">
                  Promo
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-gold transition-colors">
                  Panduan Pemilihan
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-gold transition-colors">
                  Tanya Jawab
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-bold mb-4">Hukum</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="hover:text-gold transition-colors">
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-gold transition-colors">
                  Syarat & Ketentuan
                </Link>
              </li>
              <li>
                <Link href="/rental-policy" className="hover:text-gold transition-colors">
                  Kebijakan Sewa
                </Link>
              </li>
              <li>
                <Link href="/return-policy" className="hover:text-gold transition-colors">
                  Kebijakan Pengembalian
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-forest-light/30 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-cream/80">
            <p>&copy; {currentYear} Habema Outdoor. Semua hak cipta dilindungi.</p>
            <p>Dibuat dengan ❤️ untuk para petualang Indonesia</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
