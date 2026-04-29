'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Sparkles, Flame, Star } from 'lucide-react'
import { supabase } from "@/lib/supabaseClient"
import React from 'react'
import { motion } from 'framer-motion'
import { useOptimizedFetch } from '@/lib/optimized-fetch'

interface Product {
  id: string;
  name: string;
  description: string;
  price_per_night: number;
  image_url: string;
  equipment_categories: {
    name: string;
  };
  rental_count: number;
  average_rating: number;
}

export function FeaturedProducts() {
  const { data: featured, loading, error, refetch } = useOptimizedFetch<Product[]>('/api/products/featured', {
    cacheTime: 10 * 60 * 1000, // 10 minutes cache
    retryCount: 2,
    dedupe: true
  })

  // Fallback to Supabase if API fails
  const fetchFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select(`*, equipment_categories ( name )`)
        .order('created_at', { ascending: false }) 
        .limit(15)

      if (error) throw error
      return data || []
    } catch (supabaseError) {
      console.error('Supabase fallback failed:', supabaseError)
      return []
    }
  }

  React.useEffect(() => {
    if (error && !loading) {
      fetchFromSupabase().then(setFeatured)
    }
  }, [error, loading])

  const products = featured || []

  if (loading) return (
    <div className="py-24 flex flex-col items-center justify-center gap-4 text-forest/40 animate-pulse">
      <Sparkles className="w-8 h-8 text-gold" />
      <p className="font-mono text-[10px] tracking-[0.3em] uppercase">Menyelaraskan Katalog Terlaris...</p>
    </div>
  )

  return (
    <section className="relative py-16 md:py-24 bg-[#FDFCFB] overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-forest/5 rounded-full blur-[120px] -z-10" />

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 md:mb-20 gap-6">
          <div className="space-y-3 md:space-y-4 max-w-2xl">
            <div className="flex items-center gap-2 text-gold font-bold text-[9px] md:text-[10px] uppercase tracking-[0.3em]">
              <Flame size={14} fill="currentColor" /> Paling Sering Di-rental
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-forest tracking-tighter leading-[0.9]">
              Gear Terfavorit <br className="md:block" /> 
              <span className="italic">Pilihan Pro.</span>
            </h2>
          </div>
            <Link 
            href="/catalog" 
            className="group relative px-6 md:px-8 py-3 md:py-4 bg-white border border-forest/10 rounded-xl md:rounded-2xl font-bold text-forest text-sm overflow-hidden transition-all hover:shadow-2xl hover:shadow-forest/10 md:w-auto text-center"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              Semua Gear <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gold/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </Link>
        </div>

        {/* Grid - 5 columns on desktop, 2 on mobile */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-2">
          {Array.isArray(products) && products.length > 0 ? (
            products.map((product, index) => {
            const price = Number(product.price_per_night || 0);

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Link href={`/product/${product.id}`} className="group block relative h-full">
                  <div className="group flex flex-col h-full rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer">
                    
                    {/* Image Section */}
                    <div className="relative aspect-square bg-slate-100 overflow-hidden rounded-t-xl">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          priority={false}
                          placeholder="blur"
                          blurDataURL="data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='40' height='40' fill='%23e2e8f'/%3E%3C/svg%3E"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center bg-slate-200 text-slate-400">
                          <div className="mb-2 w-10 h-10 opacity-20 rounded-full bg-slate-300"></div>
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">
                            No Image Available
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="p-2.5 flex flex-col flex-grow">
                      {/* Nama Produk */}
                      <h3 className="text-[12px] font-medium text-slate-700 line-clamp-2 mb-1 min-h-[32px] group-hover:text-[#1B4332] transition-colors">
                        {product.name}
                      </h3>

                      {/* Harga */}
                      <div className="mb-1.5">
                        <span className="text-sm font-bold text-[#FF6B35]">
                          Rp{price.toLocaleString("id-ID")}
                        </span>
                        <span className="text-[9px] text-slate-400 ml-1">/hari</span>
                      </div>

                      {/* Rating & Stats (Footer Card) */}
                      <div className="mt-auto pt-1.5 flex items-center gap-1 text-[9px] text-slate-500 font-medium border-t border-slate-50">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span>{product.average_rating || 4.9}</span>
                        <span className="text-slate-300">|</span>
                        <span>Tersewa {product.rental_count || 0}x</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
            })
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-forest/60">
                Memuat data produk...
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}