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
      const { data, error } = await supabase
        .from('equipment')
        .select(`*, equipment_categories ( name )`)
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
            className="group relative px-6 md:px-8 py-3 md:py-4 bg-white border border-forest/10 rounded-xl md:rounded-2xl font-bold text-forest text-sm overflow-hidden transition-all mx-auto ms-75 hover:shadow-2xl hover:shadow-forest/10 md:w-auto text-center"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              Semua Gear <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gold/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </Link>
        </div>

        {/* Grid - FIXED: 2 columns on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
          {featured.map((product, index) => {
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
                  <div className="relative z-10 bg-white rounded-[1.5rem] md:rounded-[2rem] p-2 md:p-4 border border-forest/5 shadow-sm group-hover:shadow-xl transition-all duration-500 h-full flex flex-col">
                    
                    {/* Image Area */}
                    <div className="relative aspect-square md:aspect-[4/5] rounded-[1.2rem] md:rounded-[1.5rem] overflow-hidden bg-slate-100">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-forest/5 text-forest/20 text-[10px] font-black italic">NO IMAGE</div>
                      )}
                      
                      {/* Rating Badge - Hidden small on mobile to save space */}
                      <div className="absolute top-2 left-2 md:top-4 md:left-4">
                        <span className="backdrop-blur-md bg-white/90 text-forest text-[8px] md:text-[9px] font-black px-2 md:px-3 py-1 rounded-lg uppercase flex items-center gap-1 shadow-sm">
                          <Star size={8} fill="#D4AF37" className="text-gold" /> 4.9
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="mt-3 md:mt-6 px-1 md:px-2 pb-1 md:pb-2 flex flex-col flex-grow justify-between space-y-2 md:space-y-4">
                      <div>
                        <h3 className="font-extrabold text-forest text-sm md:text-lg line-clamp-1 group-hover:text-gold transition-colors">
                          {product.name}
                        </h3>
                        <p className="hidden md:block text-[9px] text-forest/40 uppercase font-bold tracking-tighter mt-1">High-Demand</p>
                      </div>
                      
                      <div className="flex items-center md:items-end justify-between gap-1">
                        <div className="space-y-0 md:space-y-0.5">
                          <p className="hidden md:block text-[8px] text-muted-foreground uppercase font-bold tracking-widest">Harga Sewa</p>
                          <p className="text-forest text-sm md:text-xl font-black flex items-start">
                            <span className="text-[8px] md:text-[10px] mt-1 font-bold">Rp</span>
                            {price.toLocaleString('id-ID')}
                            <span className="hidden md:inline text-[10px] mt-1.5 font-medium text-forest/40 ml-1">/hari</span>
                          </p>
                        </div>
                        
                        <div className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-forest/5 flex items-center justify-center group-hover:bg-gold transition-colors shrink-0">
                          <ArrowRight className="w-3.5 h-3.5 md:w-5 md:h-5 text-forest" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Decorative Background Card - Smaller offset on mobile */}
                  <div className="absolute inset-0 bg-gold/20 rounded-[1.5rem] md:rounded-[2rem] translate-x-0 translate-y-0 group-hover:translate-x-1.5 group-hover:translate-y-1.5 md:group-hover:translate-x-3 md:group-hover:translate-y-3 transition-transform duration-500 -z-10" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  )
}