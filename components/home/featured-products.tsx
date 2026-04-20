'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Sparkles, Flame, Star } from 'lucide-react'
import { supabase } from "@/lib/supabaseClient"
import React from 'react'
import { motion } from 'framer-motion'

export function FeaturedProducts() {
  const [featured, setFeatured] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  const fetchMostRentedProducts = async () => {
    try {
      setLoading(true)
      /**
       * MENGAMBIL DATA BERDASARKAN POPULARITAS:
       * Jika di tabel 'equipment' ada kolom 'rental_count', urutkan berdasarkan itu.
       * Jika belum ada, kita urutkan berdasarkan produk terbaru sebagai gear unggulan.
       */
      const { data, error } = await supabase
        .from('equipment')
        .select(`*, equipment_categories ( name )`)
        // Ganti 'created_at' menjadi 'rental_count' jika kolom tersebut sudah tersedia
        .order('created_at', { ascending: false }) 
        .limit(4)

      if (error) throw error
      setFeatured(data || [])
    } catch (error) {
      console.error('Error fetching popular products:', error)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchMostRentedProducts()
  }, [])

  if (loading) return (
    <div className="py-24 flex flex-col items-center justify-center gap-4 text-forest/40 animate-pulse">
      <Sparkles className="w-8 h-8 text-gold" />
      <p className="font-mono text-xs tracking-[0.3em] uppercase">Menyelaraskan Katalog Terlaris...</p>
    </div>
  )

  return (
    <section className="relative py-24 bg-[#FDFCFB] overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-forest/5 rounded-full blur-[120px] -z-10" />

      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header - Fokus pada Produk Populer */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-2 text-gold font-bold text-[10px] uppercase tracking-[0.3em]">
              <Flame size={14} fill="currentColor" /> Paling Sering Di-rental
            </div>
            <h2 className="text-5xl lg:text-6xl font-black text-forest tracking-tighter leading-none">
              Gear Terfavorit <br /> 
              <span className="italic">Pilihan Pro.</span>
            </h2>
          </div>
          
          <Link 
            href="/catalog" 
            className="group relative px-8 py-4 bg-white border border-forest/10 rounded-2xl font-bold text-forest overflow-hidden transition-all hover:shadow-2xl hover:shadow-forest/10"
          >
            <span className="relative z-10 flex items-center gap-3">
              Lihat Semua Gear <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gold/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </Link>
        </div>

        {/* Grid - Menampilkan Produk Terlaris */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {featured.map((product, index) => {
            const price = Number(product.price_per_night || 0);

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Link href={`/product/${product.id}`} className="group block relative">
                  <div className="relative z-10 bg-white rounded-[2rem] p-4 border border-forest/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group-hover:shadow-[0_20px_50px_rgba(27,67,50,0.1)] transition-all duration-500">
                    
                    {/* Image Area dengan Badge Rating */}
                    <div className="relative aspect-[4/5] rounded-[1.5rem] overflow-hidden bg-slate-100">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-forest/5 text-forest/20 font-black italic">NO IMAGE</div>
                      )}
                      
                      {/* Badge Rating & Popularitas */}
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        <span className="backdrop-blur-xl bg-white/90 text-forest text-[9px] font-black px-3 py-1.5 rounded-lg uppercase flex items-center gap-1 shadow-sm">
                          <Star size={10} fill="#D4AF37" className="text-gold" /> 4.9
                        </span>
                      </div>

                      <div className="absolute bottom-4 left-4">
                        <span className="backdrop-blur-xl bg-forest/80 text-white text-[9px] font-bold px-4 py-2 rounded-xl uppercase tracking-widest border border-white/20">
                          {product.equipment_categories?.name || 'Gear'}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="mt-6 px-2 pb-2 space-y-4">
                      <div>
                        <h3 className="font-extrabold text-forest text-lg line-clamp-1 group-hover:text-gold transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-[10px] text-forest/40 uppercase font-bold tracking-tighter mt-1">High-Demand Equipment</p>
                      </div>
                      
                      <div className="flex items-end justify-between">
                        <div className="space-y-0.5">
                          <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Harga Sewa</p>
                          <p className="text-forest text-xl font-black flex items-start gap-0.5">
                            <span className="text-[10px] mt-1.5 font-bold">Rp</span>
                            {price.toLocaleString('id-ID')}
                            <span className="text-[10px] mt-1.5 font-medium text-forest/40 ml-1">/hari</span>
                          </p>
                        </div>
                        
                        <div className="w-10 h-10 rounded-full bg-forest/5 flex items-center justify-center group-hover:bg-gold transition-colors duration-300">
                          <ArrowRight className="w-5 h-5 text-forest group-hover:text-forest transition-colors" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Decorative Background Card */}
                  <div className="absolute inset-0 bg-gold/20 rounded-[2rem] translate-x-0 translate-y-0 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform duration-500 -z-10" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  )
}