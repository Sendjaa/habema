'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Facebook, Instagram, MapPin, Phone, Clock } from 'lucide-react'
import Image from 'next/image'

interface Branch {
  id: string
  name: string
  address: string | null
  city: string | null
  phone: string | null
  operational_hours: string | null
  map_url: string | null
}

export function Footer() {
  const currentYear = new Date().getFullYear()
  const [branches, setBranches] = useState<Branch[]>([])

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await fetch('/api/branches')
        const result = await res.json()
        if (result.success) {
          setBranches(result.data || [])
        }
      } catch {
        // silently fail
      }
    }
    fetchBranches()
  }, [])

  return (
    <footer className="bg-forest text-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {/* Brand Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Image src="/images/logo-dark.webp" alt="Habema Logo" width={64} height={64} />
            </div>
            <p className="text-cream/80 text-xs leading-relaxed">
              Platform penyewaan peralatan outdoor terpercaya untuk petualangan Anda.
            </p>
            <div className="flex gap-2 mt-3">
              <a href="#" className="hover:text-gold transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://www.instagram.com/habemaoutdoor?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" className="hover:text-gold transition-colors" target="_blank" rel="noopener noreferrer">
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-bold text-sm mb-3">Perusahaan</h4>
            <ul className="space-y-1.5 text-xs">
              <li><Link href="/about" className="hover:text-gold transition-colors">Tentang Kami</Link></li>
              <li><Link href="/contact" className="hover:text-gold transition-colors">Hubungi Kami</Link></li>
              <li><Link href="/careers" className="hover:text-gold transition-colors">Karir</Link></li>
              <li><Link href="/blog" className="hover:text-gold transition-colors">Blog</Link></li>
            </ul>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-bold text-sm mb-3">Produk</h4>
            <ul className="space-y-1.5 text-xs">
              <li><Link href="/catalog_rental" className="hover:text-gold transition-colors">Katalog Sewa</Link></li>
              <li><Link href="/catalog_shop" className="hover:text-gold transition-colors">Katalog Beli</Link></li>
              <li><Link href="/packages" className="hover:text-gold transition-colors">Paket Bundling</Link></li>
              <li><Link href="/bundles" className="hover:text-gold transition-colors">Promo</Link></li>
              <li><Link href="/faq" className="hover:text-gold transition-colors">Tanya Jawab</Link></li>
            </ul>
          </div>

          {/* Cabang Kami */}
          <div>
            <h4 className="font-bold text-sm mb-3">Cabang Kami</h4>
            {branches.length > 0 ? (
              <div className="space-y-3">
                {branches.map((b) => {
                  const addr = `${b.address || ''}${b.city ? `, ${b.city}` : ''}`
                  const mapsUrl = b.map_url || `https://maps.google.com/?q=${encodeURIComponent(addr)}`
                  return (
                    <div key={b.id}>
                      <p className="text-xs font-semibold mb-1">{b.name}</p>
                      <div className="space-y-0.5">
                        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-start gap-1 text-[11px] text-cream/70 hover:text-gold transition-colors">
                          <MapPin className="w-3 h-3 mt-px shrink-0" />
                          <span>{addr}</span>
                        </a>
                        {b.phone && (
                          <a href={`tel:${b.phone.replace(/[^0-9]/g, '').startsWith('0') ? '62' + b.phone.replace(/[^0-9]/g, '').slice(1) : b.phone.replace(/[^0-9]/g, '')}`} className="flex items-center gap-1 text-[11px] text-cream/70 hover:text-gold transition-colors">
                            <Phone className="w-3 h-3 shrink-0" />
                            <span>{b.phone}</span>
                          </a>
                        )}
                        {b.operational_hours && (
                          <div className="flex items-center gap-1 text-[11px] text-cream/60">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>{b.operational_hours}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-0.5">
                <p className="text-xs font-semibold">Habema Cihanjuang</p>
                <p className="text-[11px] text-cream/70">Jl. Raya Cihanjuang No. 123, Bandung Barat</p>
              </div>
            )}
          </div>
        </div>

        {/* Divider & Copyright */}
        <div className="border-t border-cream/20 pt-5">
          <div className="flex flex-col md:flex-row justify-between items-center text-xs text-cream/60">
            <p>&copy; {currentYear} Habema Outdoor. Semua hak cipta dilindungi.</p>
            <p>Dibuat dengan ❤️ untuk para petualang Indonesia</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
