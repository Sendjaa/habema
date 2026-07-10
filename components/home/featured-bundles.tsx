'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ArrowRight, Zap } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import React from 'react'
import { useState, useEffect, useRef } from "react";
import { useOptimizedFetch, api } from '@/lib/optimized-fetch'

/* ─── HOOKS ──────────────────────────────────────── */
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true);
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

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
};

/* ─── CARD ───────────────────────────────────────── */
function FeaturedBundlesCard({ pkg, index }: { pkg: Package; index: number }) {
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
      <div className="relative rounded-[28px] overflow-hidden bg-white shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 border border-stone-100 flex flex-col">
        {/* IMAGE */}
        <div className="relative h-52 overflow-hidden flex-shrink-0">
          <Image
            src={pkg.image}
            alt={pkg.label}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

          {/* category pill */}
          <span
            className="absolute top-3 left-3 text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full"
            style={{ background: pkg.accentLight, color: pkg.accent }}
          >
            {pkg.category}
          </span>

          {/* badge */}
          {pkg.badge && (
            <span
              className="absolute top-3 right-3 text-[11px] font-bold px-3 py-1 rounded-full text-white shadow"
              style={{ background: pkg.accent }}
            >
              {pkg.badge}
            </span>
          )}

          {/* price */}
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
                  <span className="text-white/70 font-normal text-xs ml-1">
                    {pkg.unit}
                  </span>
                )}
              </p>
            ) : (
              <p className="text-white/90 font-semibold text-sm italic drop-shadow">
                Harga custom
              </p>
            )}
          </div>
        </div>

        {/* BODY */}
        <div className="p-5 flex flex-col flex-1 gap-3">
          <h3
            className="font-display text-lg font-black text-stone-900 leading-snug"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            {pkg.label}
          </h3>
          <p className="text-stone-500 text-sm leading-relaxed">{pkg.desc}</p>

          {/* include */}
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
                  <span
                    style={{ color: pkg.accent }}
                    className="flex-shrink-0 mt-0.5 text-xs"
                  >
                    ✦
                  </span>
                  {it}
                </li>
              ))}
            </ul>

            {pkg.exclude && pkg.exclude.length > 0 && (
              <div className="mt-3">
                <p className="text-[11px] font-bold uppercase tracking-widest mb-2 text-stone-400">
                  Exclude
                </p>
                <ul className="space-y-1">
                  {pkg.exclude?.map?.((it) => (
                    <li key={it} className="flex gap-2 text-sm text-stone-400">
                      <span className="flex-shrink-0 mt-0.5 text-xs">✕</span>
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* CTA */}
          <a
            href={`https://wa.me/6283898749357?text=Halo%20Habema%20Outdoor%2C%20saya%20tertarik%20dengan%20${encodeURIComponent(
              pkg.label
            )}`}
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
  );
}

export function FeaturedBundles() {
  const { data: bundlesResponse, loading, error, refetch } = useOptimizedFetch<{ success: boolean; data: any[] }>('/api/bundles', {
    cacheTime: 15 * 60 * 1000, // 15 minutes cache
    retryCount: 2,
    dedupe: true
  })

  // Extract actual bundles data from response
  const bundlesData = bundlesResponse?.success ? bundlesResponse.data : null

  // Fallback data if API fails
  const fallbackBundles = [
    {
      id: 'fallback-1',
      category: 'Pendakian',
      label: 'Paket Basic',
      badge: 'Populer',
      price: '250.000',
      unit: '/hari',
      desc: 'Perlengkapan dasar untuk pendakian singkat',
      image: '/images/bundles/basic.jpg',
      include: ['Tenda', 'Sleeping Bag', 'Carrier'],
      accent: '#1B4332',
      accentLight: '#E8F5E8'
    },
    {
      id: 'fallback-2',
      category: 'Camping',
      label: 'Paket Premium',
      badge: 'Best Value',
      price: '450.000',
      unit: '/hari',
      desc: 'Perlengkapan lengkap untuk camping nyaman',
      image: '/images/bundles/premium.jpg',
      include: ['Tenda', 'Sleeping Bag', 'Carrier', 'Matras', 'Cooking Set'],
      accent: '#FF6B35',
      accentLight: '#FFE8DC'
    },
    {
      id: 'fallback-3',
      category: 'Adventure',
      label: 'Paket Pro',
      badge: 'Ultimate',
      price: '650.000',
      unit: '/hari',
      desc: 'Perlengkapan profesional untuk petualangan ekstrem',
      image: '/images/bundles/pro.jpg',
      include: ['Tenda Premium', 'Sleeping Bag Premium', 'Carrier Pro', 'Matras', 'Cooking Set Pro', 'Headlamp'],
      accent: '#2D5016',
      accentLight: '#F0F8E8'
    }
  ]

  const bundles = (Array.isArray(bundlesData) ? bundlesData.slice(0, 3) : []) || (error ? fallbackBundles : [])

  // Prefetch bundles data when component mounts
  React.useEffect(() => {
    api.prefetch('/api/bundles')
  }, [])

  return (
    <section className="py-20 bg-[#f9f7f4]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #f9f7f4; }

        @keyframes fadeUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }

        /* custom scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f9f7f4; }
        ::-webkit-scrollbar-thumb { background: #d6d3d1; border-radius: 99px; }
      `}</style>
      
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2">
            Paket Terpopuler
          </p>
          <h2 
            className="text-3xl md:text-4xl font-black text-stone-900 leading-tight"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Petualangan Terbaik<br />
            <span style={{ fontStyle: "italic", color: "#a8a29e" }}>
              Untuk Anda
            </span>
          </h2>
          <p className="text-stone-500 max-w-2xl mx-auto">
            Hemat hingga 25% dengan paket bundling kami yang dirancang khusus untuk setiap jenis petualangan.
          </p>
        </div>

        {/* Bundles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {Array.isArray(bundles) && bundles.length > 0 ? (
            bundles.map((pkg, i) => (
              <FeaturedBundlesCard key={pkg?.id || `pkg-${i}`} pkg={pkg} index={i} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-stone-500">
                {loading ? "Memuat data..." : "Tidak ada paket yang tersedia"}
              </p>
            </div>
          )}
        </div>

        {/* View All */}
        <div className="text-center mt-12">
          <Button
            variant="outline"
            size="lg"
            asChild
            className="rounded-2xl border-stone-300 text-stone-700 hover:bg-stone-50 transition-all duration-300"
          >
            <Link href="/opentrip">
              Lihat Semua Paket
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
