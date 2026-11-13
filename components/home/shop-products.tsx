'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ShopGrid } from '@/components/catalog/shop-grid'
import { supabase } from '@/lib/supabaseClient'

/**
 * Produk untuk dibeli — client component yang fetch produk dari Supabase.
 * Hero section dipisah ke ShopHeroSection (server component).
 */
export function ShopProducts() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true

    const load = async () => {
      const { data, error } = await supabase
        .from('shop_products')
        .select('*')
        .order('sold_count', { ascending: false })
        .limit(8)

      if (!alive) return
      if (error) console.error('Gagal ambil produk dijual:', error.message)
      setProducts(data ?? [])
      setLoading(false)
    }

    load()
    return () => {
      alive = false
    }
  }, [])

  return (
      <section className="py-4 md:py-8 lg:py-12 pt-4 md:pt-8 lg:pt-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-4 md:pt-8 lg:pt-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-4">
          <div className="space-y-3">
            <h3 className="text-4xl md:text-5xl lg:text-6xl font-sans font-bold text-stone-900 tracking-tighter leading-[0.9]">
              Dapatkan Sekarang Juga
            </h3>
          </div>
          <Link
            href="/catalog_shop"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-secondary px-6 text-xs font-bold uppercase tracking-wider text-secondary-foreground shadow-sm transition-colors hover:bg-secondary/80"
          >
            Semua Produk
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-xl border border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : (
          products.length > 0 && <ShopGrid products={products} />
        )}
      </div>
    </section>
  )
}