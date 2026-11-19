'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FeaturedBundlesCard } from '@/components/home/featured-bundles'

type Package = {
  id: string
  category: string
  label: string
  badge?: string
  price?: string
  priceOld?: string
  unit?: string
  paxLabel?: string | null
  desc: string
  image: string
  include: string[]
  exclude?: string[]
  accent: string
  accentLight: string
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [branchPhone, setBranchPhone] = useState('6283898749357')

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await fetch('/api/bundles', { cache: 'no-store' })
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          setPackages(json.data)
        }
      } catch (err) {
        console.error('Failed to fetch packages:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPackages()
  }, [])

  useEffect(() => {
    const fetchBranchPhone = async () => {
      try {
        const res = await fetch('/api/branches')
        const result = await res.json()
        if (result.success && result.data?.length > 0 && result.data[0].phone) {
          const cleaned = String(result.data[0].phone).replace(/[^0-9]/g, '')
          setBranchPhone(cleaned.startsWith('0') ? '62' + cleaned.slice(1) : cleaned.startsWith('62') ? cleaned : '62' + cleaned)
        }
      } catch {}
    }
    fetchBranchPhone()
  }, [])

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-black uppercase leading-[0.95] tracking-tight text-stone-900">
              Pilih Paket Petualanganmu
            </h1>
            <p className="mt-5 max-w-xl text-sm md:text-base leading-relaxed text-stone-600 mx-auto">
              Hemat hingga 25% dengan paket bundling yang dirancang khusus untuk setiap jenis petualangan.
            </p>
          </div>
        </div>
      </section>

      {/* Package list */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-4">Pilihan Paket</p>
          <h2 className="text-3xl md:text-4xl font-black text-stone-900 leading-tight">
            Pilih Paket Petualanganmu
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <span className="w-6 h-6 border-2 border-forest border-t-transparent rounded-full animate-spin" />
              <span className="ml-2 text-stone-600">Memuat paket...</span>
            </div>
          ) : packages.length === 0 ? (
            <div className="text-center py-20 text-stone-400">
              <p className="text-lg font-medium text-stone-500">Belum ada paket tersedia</p>
              <p className="text-sm mt-1">Cek kembali nanti untuk paket terbaru</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <FeaturedBundlesCard
                  key={pkg.id}
                  pkg={pkg}
                  branchPhone={branchPhone}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-forest text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-black uppercase tracking-tight mb-4">
            Mau paket custom?
          </h2>
          <p className="text-base text-forest-light mb-6">
            Tim Habema siap membantu meracik paket perlengkapan sesuai kebutuhan petualanganmu.
          </p>
          <a
            href="https://wa.me/6283898749357?text=Halo%20Habema%2C%20saya%20mau%20tanya%20soal%20paket%20bundling"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-6 text-sm font-bold text-forest hover:bg-forest-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/30 focus-visible:ring-offset-2">
            Tanya via WhatsApp
          </a>
        </div>
      </section>
    </div>
  )
}