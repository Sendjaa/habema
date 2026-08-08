'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Sparkles, Package } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import React from 'react'
import { useState, useEffect, useRef } from "react"

type Package = {
  id: string;
  category: string;
  label: string;
  badge?: string;
  price?: string;
  priceOld?: string;
  unit?: string;
  desc: string;
  image: string;
  include: string[];
  exclude?: string[];
  accent: string;
  accentLight: string;
}

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true) },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function PackageCard({ pkg, index }: { pkg: Package; index: number }) {
  const { ref, visible } = useInView();

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${(index % 3) * 90}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transitionProperty: "opacity, transform",
        transitionDuration: "0.65s",
        transitionTimingFunction: "ease",
      }}
      className="group"
    >
      <div className="relative rounded-[28px] overflow-hidden bg-white shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 border border-stone-100 flex flex-col h-full">
        <div className="relative h-52 overflow-hidden flex-shrink-0">
          <Image
            src={pkg.image}
            alt={pkg.label}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

          <span
            className="absolute top-3 left-3 text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full"
            style={{ background: pkg.accentLight, color: pkg.accent }}
          >
            {pkg.category}
          </span>

          {pkg.badge && (
            <span
              className="absolute top-3 right-3 text-[11px] font-bold px-3 py-1 rounded-full text-white shadow"
              style={{ background: pkg.accent }}
            >
              {pkg.badge}
            </span>
          )}

          <div className="absolute bottom-3 right-3 text-right">
            {pkg.priceOld && (
              <p className="text-white/60 text-xs line-through leading-none">
                Rp {pkg.priceOld}
              </p>
            )}
            {pkg.price ? (
              <p className="text-white font-black text-lg leading-tight drop-shadow-md">
                Rp {pkg.price}
                {pkg.unit && (
                  <span className="text-white/70 font-normal text-xs ml-1">{pkg.unit}</span>
                )}
              </p>
            ) : (
              <p className="text-white/90 font-semibold text-sm italic drop-shadow">
                Harga custom
              </p>
            )}
          </div>
        </div>

        <div className="p-5 flex flex-col flex-1 gap-3">
          <h3 className="text-lg font-black text-stone-900 leading-snug">
            {pkg.label}
          </h3>
          <p className="text-stone-500 text-sm leading-relaxed">{pkg.desc}</p>

          <div className="flex-1">
            <p
              className="text-[11px] font-bold uppercase tracking-widest mb-2"
              style={{ color: pkg.accent }}
            >
              Include
            </p>
            <ul className="space-y-1">
              {pkg.include?.map?.((it) => (
                <li key={it} className="flex gap-2 text-sm text-stone-600">
                  <span style={{ color: pkg.accent }} className="flex-shrink-0 mt-0.5 text-xs">✦</span>
                  {it}
                </li>
              ))}
            </ul>

            {pkg.exclude && pkg.exclude.length > 0 && (
              <div className="mt-3">
                <p className="text-[11px] font-bold uppercase tracking-widest mb-2 text-stone-600">Exclude</p>
                <ul className="space-y-1">
                  {pkg.exclude?.map?.((it) => (
                    <li key={it} className="flex gap-2 text-sm text-stone-600">
                      <span className="flex-shrink-0 mt-0.5 text-xs">✕</span>
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <a
            href={`https://wa.me/${branchPhone}?text=Halo%20Habema%20Outdoor%2C%20saya%20tertarik%20dengan%20${encodeURIComponent(pkg.label)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block text-center py-3.5 rounded-2xl font-bold text-sm tracking-wide transition-all duration-300 hover:opacity-85 active:scale-[0.98] shadow-sm"
            style={{ background: pkg.accent, color: "#fff" }}
          >
            Pesan via WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}

const colorMap: Record<string, { accent: string; accentLight: string }> = {
  'Open Trip': { accent: '#d97706', accentLight: '#fef3c7' },
  'Camping Keluarga': { accent: '#16a34a', accentLight: '#dcfce7' },
  'Private Camp': { accent: '#0284c7', accentLight: '#e0f2fe' },
  'Campervan': { accent: '#dc2626', accentLight: '#fee2e2' },
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [branchPhone, setBranchPhone] = useState("6283898749357")
  const titleRef = useInView(0.1)

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await fetch('/api/bundles')
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

  // Fetch nomor telepon cabang
  useEffect(() => {
    const fetchBranchPhone = async () => {
      try {
        const res = await fetch('/api/branches')
        const result = await res.json()
        if (result.success && result.data?.length > 0 && result.data[0].phone) {
          const cleaned = result.data[0].phone.replace(/[^0-9]/g, '')
          const waNumber = cleaned.startsWith('0') ? '62' + cleaned.slice(1) : cleaned.startsWith('62') ? cleaned : '62' + cleaned
          setBranchPhone(waNumber)
        }
      } catch {}
    }
    fetchBranchPhone()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <style>{`* { box-sizing: border-box; }`}</style>

      <section className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-stone-950 pt-28 pb-16 md:pt-32 md:pb-20">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[length:18px_18px]" />
        <div className="max-w-6xl mx-auto px-4 md:px-8 relative text-center">
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-amber-300 uppercase mb-4">
            <Package className="w-4 h-4" />
            Paket Bundling
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4">
            Paket Lengkap{" "}
            <span className="italic text-amber-300">Habema</span>
          </h1>
          <p className="text-stone-100/80 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Hemat hingga 25% dengan paket bundling yang dirancang khusus untuk
            setiap jenis petualangan.
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 md:px-8 pt-12 pb-24">
        <div
          ref={titleRef.ref}
          className="mb-8"
          style={{
            opacity: titleRef.visible ? 1 : 0,
            transform: titleRef.visible ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.7s ease, transform 0.7s ease",
          }}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2">Pilihan Paket</p>
          <h2 className="text-3xl md:text-4xl font-black text-stone-900 leading-tight">
            Pilih Paket Petualanganmu
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-20 text-stone-400">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium text-stone-500">Belum ada paket tersedia</p>
            <p className="text-sm mt-1">Cek kembali nanti untuk paket terbaru</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg, i) => (
              <PackageCard key={pkg.id || `pkg-${i}`} pkg={pkg} index={i} />
            ))}
          </div>
        )}

        <div className="mt-16 rounded-[32px] bg-white border border-stone-100 shadow-sm px-8 md:px-12 py-10 text-center">
          <h3 className="text-2xl md:text-3xl font-black text-stone-900 leading-snug mb-3">
            Mau paket custom?
          </h3>
          <p className="text-stone-500 text-sm mb-6 max-w-md mx-auto">
            Tim Habema siap membantu meracik paket perlengkapan sesuai kebutuhan petualanganmu.
          </p>
          <a
            href={`https://wa.me/${branchPhone}?text=Halo%20Habema%2C%20saya%20mau%20tanya%20soal%20paket%20bundling`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-300 shadow-lg"
          >
            Tanya via WhatsApp
          </a>
        </div>
      </main>
    </div>
  )
}