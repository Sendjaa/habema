'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useMemo } from 'react'
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
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [activePackageId, setActivePackageId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'matrix' | 'cards'>('matrix')

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await fetch('/api/bundles', { cache: 'no-store' })
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          setPackages(json.data)
          if (json.data.length > 0) {
            setActivePackageId(json.data[0].id)
          }
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
          setBranchPhone(
            cleaned.startsWith('0')
              ? '62' + cleaned.slice(1)
              : cleaned.startsWith('62')
                ? cleaned
                : '62' + cleaned
          )
        }
      } catch {}
    }
    fetchBranchPhone()
  }, [])

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(packages.map((p) => p.category).filter(Boolean))
    )
    return ['ALL', ...unique]
  }, [packages])

  const filteredPackages = useMemo(() => {
    if (selectedCategory === 'ALL') return packages
    return packages.filter((p) => p.category === selectedCategory)
  }, [packages, selectedCategory])

  // Pastikan paket aktif selalu sinkron dengan filter kategori
  const selectedPackage = useMemo(() => {
    if (filteredPackages.length === 0) return null
    return (
      filteredPackages.find((p) => p.id === activePackageId) ||
      filteredPackages[0]
    )
  }, [filteredPackages, activePackageId])

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      {/* =================================================================
          1. FLAT EDITORIAL HEADER (NO GRADIENT BLOBS, NO MARKETING PILLS)
         ================================================================= */}
      <header className="border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-5 sm:pt-10 sm:pb-7">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-forest">
                Tarif Bundling Perlengkapan
              </p>
              <h1 className="font-sans text-2xl sm:text-4xl font-bold text-foreground tracking-tight leading-[1.1]">
                Paket Sewa Gear Habema
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Kombinasi tenda, alat tidur, dan perlengkapan masak dengan potongan hingga 25% dibandingkan sewa satuan.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs shrink-0">
              <Link
                href="/catalog_rental"
                className="font-bold text-forest hover:text-forest-dark underline underline-offset-4"
              >
                Lihat Sewa Satuan →
              </Link>
            </div>
          </div>

          {/* Filter Kategori & Mode Tampilan */}
          {!loading && packages.length > 0 && (
            <div className="mt-5 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
              {/* Underline Tabs Kategori */}
              <div
                role="tablist"
                aria-label="Filter kategori paket"
                className="flex items-center gap-5 overflow-x-auto no-scrollbar"
              >
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat
                  return (
                    <button
                      key={cat}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => {
                        setSelectedCategory(cat)
                        const nextList =
                          cat === 'ALL'
                            ? packages
                            : packages.filter((p) => p.category === cat)
                        if (nextList[0]) setActivePackageId(nextList[0].id)
                      }}
                      className={`pb-2 text-xs font-bold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                        isActive
                          ? 'border-forest text-forest'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {cat === 'ALL' ? `Semua (${packages.length})` : cat}
                    </button>
                  )
                })}
              </div>

              {/* Switcher Tampilan (Desktop) */}
              <div className="hidden lg:flex items-center border border-border rounded-2xl p-0.5 bg-muted/40 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setViewMode('matrix')}
                  className={`px-3 py-1 rounded-xl transition-colors cursor-pointer ${
                    viewMode === 'matrix'
                      ? 'bg-background text-foreground border border-border'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Tampilan Rincian
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1 rounded-xl transition-colors cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-background text-foreground border border-border'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Tampilan Kartu
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* =================================================================
          2. MAIN WORKSPACE:
             - MOBILE: COMPACT TABBED SELECTOR + SINGLE ACTIVE SPEC SHEET (ZERO VERTICAL BLOAT)
             - DESKTOP: MASTER-DETAIL RATE SHEET ATAU GRID KARTU
         ================================================================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {loading ? (
          <div className="rounded-2xl border border-border bg-card p-8 flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <span className="w-4 h-4 border-2 border-forest border-t-transparent rounded-full animate-spin" />
            <span>Memuat Daftar Paket...</span>
          </div>
        ) : filteredPackages.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center space-y-2">
            <p className="font-sans text-base font-bold text-foreground">
              Belum ada paket pada kategori ini
            </p>
            <p className="text-xs text-muted-foreground">
              Pilih tab kategori lain atau hubungi tim Habema untuk kebutuhan rombongan.
            </p>
          </div>
        ) : viewMode === 'cards' ? (
          /* Mode Grid Kartu (Bila dipilih pengguna di Desktop) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPackages.map((pkg, index) => (
              <FeaturedBundlesCard
                key={pkg.id}
                pkg={pkg}
                index={index}
                branchPhone={branchPhone}
              />
            ))}
          </div>
        ) : (
          /* Mode Master-Detail Spec Sheet (Anti-Slop, Zero Vertical Bloat di Mobile) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* KIRI / ATAS: DAFTAR PILIHAN PAKET
                - Di Mobile: Pill Bar Horizontal Ringkas (1 baris, tidak memanjang ke bawah)
                - Di Desktop: Daftar Baris Interaktif */}
            <div className="lg:col-span-5">
              {/* Mobile Compact Package Switcher */}
              <div className="lg:hidden space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <span>Pilih Paket ({filteredPackages.length})</span>
                  {filteredPackages.length > 2 && (
                    <span className="text-gold">Geser pilihan →</span>
                  )}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {filteredPackages.map((pkg) => {
                    const isSelected = selectedPackage?.id === pkg.id
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setActivePackageId(pkg.id)}
                        className={`px-3.5 py-2.5 rounded-2xl border text-left shrink-0 transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-forest text-primary-foreground border-forest'
                            : 'bg-card text-foreground border-border hover:border-forest'
                        }`}
                      >
                        <span className="block text-xs font-bold whitespace-nowrap">
                          {pkg.label}
                        </span>
                        {pkg.price && (
                          <span
                            className={`block text-[11px] font-semibold tabular-nums mt-0.5 ${
                              isSelected
                                ? 'text-forest-tint'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {pkg.price}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Desktop Master Rate-Sheet List */}
              <div className="hidden lg:block rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
                <div className="px-5 py-3 bg-muted/40 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground flex justify-between">
                  <span>Pilihan Paket</span>
                  <span>Tarif / Malam</span>
                </div>

                {filteredPackages.map((pkg) => {
                  const isSelected = selectedPackage?.id === pkg.id
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setActivePackageId(pkg.id)}
                      className={`w-full px-5 py-4 text-left flex items-center justify-between gap-4 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-forest-soft/70 border-l-2 border-l-forest'
                          : 'bg-background hover:bg-muted/30'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-sans text-sm font-bold text-foreground truncate">
                            {pkg.label}
                          </span>
                          {pkg.badge && (
                            <span className="px-2 py-0.5 rounded-2xl bg-accent text-accent-foreground text-[11px] font-bold shrink-0">
                              {pkg.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {pkg.paxLabel || pkg.category} · {pkg.include?.length || 0} item perlengkapan
                        </p>
                      </div>

                      <div className="text-right shrink-0 tabular-nums">
                        {pkg.price && (
                          <span className="block font-sans text-sm font-bold text-forest">
                            {pkg.price}
                          </span>
                        )}
                        {pkg.priceOld && (
                          <span className="block text-[11px] text-muted-foreground line-through">
                            {pkg.priceOld}
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* KANAN / BAWAH: LEMBAR SPESIFIKASI PAKET TERPILIH */}
            {selectedPackage && (
              <section className="lg:col-span-7 min-w-0 rounded-2xl border border-border bg-card overflow-hidden">
                {/* Foto & Ringkasan Harga */}
                <div className="grid grid-cols-1 md:grid-cols-12 border-b border-border">
                  <div className="md:col-span-5 relative h-48 sm:h-56 md:h-auto md:min-h-[210px] bg-muted border-b md:border-b-0 md:border-r border-border">
                    <Image
                      src={selectedPackage.image || '/images/package-header.png'}
                      alt={selectedPackage.label}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 768px) 40vw, 100vw"
                      className="object-cover"
                    />
                  </div>

                  <div className="md:col-span-7 p-4 sm:p-6 bg-background flex flex-col justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                        <span className="text-forest">
                          {selectedPackage.category}
                        </span>
                        {selectedPackage.paxLabel && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-foreground">
                              {selectedPackage.paxLabel}
                            </span>
                          </>
                        )}
                      </div>

                      <h2 className="font-sans text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                        {selectedPackage.label}
                      </h2>

                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {selectedPackage.desc}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-border flex flex-wrap items-baseline justify-between gap-2 tabular-nums">
                      <div>
                        <span className="block text-xs font-semibold text-muted-foreground">
                          Harga sewa paket
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span className="font-sans text-xl sm:text-2xl font-bold text-forest">
                            {selectedPackage.price || 'Hubungi Admin'}
                          </span>
                          {selectedPackage.unit && (
                            <span className="text-xs text-muted-foreground">
                              {selectedPackage.unit}
                            </span>
                          )}
                        </div>
                      </div>

                      {selectedPackage.priceOld && (
                        <span className="text-xs text-muted-foreground line-through">
                          {selectedPackage.priceOld}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Daftar Perlengkapan (Include & Exclude) */}
                <div className="p-4 sm:p-6 bg-background space-y-5">
                  <div
                    className={`grid grid-cols-1 ${
                      selectedPackage.exclude && selectedPackage.exclude.length > 0
                        ? 'sm:grid-cols-2'
                        : ''
                    } gap-5`}
                  >
                    <div>
                      <h3 className="font-sans text-xs font-bold text-forest mb-2.5">
                        Perlengkapan Termasuk ({selectedPackage.include?.length || 0})
                      </h3>
                      <ul className="space-y-1.5">
                        {(selectedPackage.include || []).map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-2 text-xs sm:text-sm text-foreground"
                          >
                            <span className="text-forest font-bold mt-0.5">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {selectedPackage.exclude && selectedPackage.exclude.length > 0 && (
                      <div>
                        <h3 className="font-sans text-xs font-bold text-muted-foreground mb-2.5">
                          Tidak Termasuk
                        </h3>
                        <ul className="space-y-1.5">
                          {selectedPackage.exclude.map((item) => (
                            <li
                              key={item}
                              className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground"
                            >
                              <span className="mt-0.5">–</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Baris Aksi */}
                  <div className="pt-4 border-t border-border flex flex-col sm:flex-row gap-2.5">
                    <Link
                      href={`/packages/${selectedPackage.id}`}
                      className="w-full sm:flex-1 h-11 rounded-2xl bg-gold hover:bg-gold-light text-secondary-foreground text-xs sm:text-sm font-bold flex items-center justify-center transition-colors"
                    >
                      Pilih Tanggal &amp; Cek Stok →
                    </Link>

                    <a
                      href={`https://wa.me/${branchPhone}?text=${encodeURIComponent(
                        `Halo Habema, saya ingin menanyakan ketersediaan ${selectedPackage.label}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto h-11 px-5 rounded-2xl border border-border bg-background hover:border-forest text-xs sm:text-sm font-bold text-foreground flex items-center justify-center transition-colors"
                    >
                      Tanya via WhatsApp
                    </a>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* =================================================================
          3. COMPACT CUSTOM BUNDLE FOOTER LINE
         ================================================================= */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 sm:pb-12 pt-2">
        <div className="rounded-2xl border border-border bg-muted/40 px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs sm:text-sm leading-relaxed">
            <span className="font-bold text-foreground">
              Butuh komposisi alat khusus untuk rombongan atau kampus?
            </span>{' '}
            <span className="text-muted-foreground">
              Tim Habema dapat menyesuaikan isi paket sesuai jumlah peserta.
            </span>
          </div>

          <a
            href={`https://wa.me/${branchPhone}?text=Halo%20Habema%2C%20saya%20mau%20tanya%20soal%20paket%20bundling%20custom`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs sm:text-sm font-bold text-forest hover:text-forest-dark underline underline-offset-4 shrink-0"
          >
            Hubungi Admin Paket →
          </a>
        </div>
      </footer>
    </div>
  )
}