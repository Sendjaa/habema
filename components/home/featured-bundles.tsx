'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ArrowRight, Zap } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import React from 'react'

export function FeaturedBundles() {
  const fetchFeaturedBundles = async () => {
    try {
      const response = await fetch('/api/bundles')
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        console.error('Error fetching featured bundles:', result.error || 'Unknown error')
        return []
      }
      
      // Return only the first 3 bundles for featured section
      return result.data.slice(0, 3) || []
    } catch (error) {
      console.error('Error fetching featured bundles:', error)
      return []
    }
  }

  const [bundles, setBundles] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetchFeaturedBundles().then((data) => {
      setBundles(data)
      setLoading(false)
    })
  }, [])

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-forest">
            Paket Hemat Terpopuler
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Hemat hingga 25% dengan paket bundling kami yang dirancang khusus untuk setiap jenis petualangan.
          </p>
        </div>

        {/* Bundles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">
                Memuat data paket...
              </p>
            </div>
          ) : Array.isArray(bundles) && bundles.length > 0 ? (
            bundles.map((bundle) => {
              // Calculate savings from API data
              const bundlePrice = bundle.price ? parseInt(bundle.price.replace(/[^\d]/g, '')) : 0
              const originalPrice = bundle.priceOld ? parseInt(bundle.priceOld.replace(/[^\d]/g, '')) : 0
              const savings = originalPrice > 0 ? originalPrice - bundlePrice : 0
              const savingsPercent = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0

            return (
              <Card
                key={bundle.id}
                className={`overflow-hidden border-2 transition-all hover:shadow-xl hover:-translate-y-1 ${
                  bundle.category === 'Open Trip'
                    ? 'border-gold bg-white'
                    : 'border-border bg-white'
                }`}
              >
                {/* Ribbon */}
                {bundle.badge && (
                  <div className="absolute top-0 right-0 bg-gold text-forest px-4 py-1 text-xs font-bold rounded-bl-lg z-10">
                    {bundle.badge}
                  </div>
                )}

                <div className="p-6 space-y-6">
                  {/* Header */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-forest mb-2">
                          {bundle.label}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {bundle.desc}
                        </p>
                      </div>
                      <span className="text-4xl">🏕️</span>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="space-y-2 pt-4 border-t border-border">
                    {bundle.priceOld && (
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm text-muted-foreground">Harga Normal:</span>
                        <span className="line-through text-muted-foreground">
                          Rp{bundle.priceOld}
                        </span>
                      </div>
                    )}
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-semibold text-forest">Harga Paket:</span>
                      <span className="text-2xl font-bold text-gold">
                        Rp{bundle.price}{bundle.unit}
                      </span>
                    </div>
                    {savings > 0 && (
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-gold" />
                        <span className="text-sm font-semibold text-gold">
                          Hemat Rp{savings.toLocaleString('id-ID')} ({savingsPercent}%)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Category Badge */}
                  <div className="pt-2">
                    <Badge
                      className={`${
                        bundle.category === 'Camping Keluarga'
                          ? 'bg-green-100 text-green-800'
                          : bundle.category === 'Open Trip'
                          ? 'bg-blue-100 text-blue-800'
                          : bundle.category === 'Private Camp'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {bundle.category === 'Camping Keluarga' && '🌱 Keluarga'}
                      {bundle.category === 'Open Trip' && '⛺ Open Trip'}
                      {bundle.category === 'Private Camp' && '🏕️ Private Camp'}
                      {bundle.category === 'Campervan' && '🚐 Campervan'}
                    </Badge>
                  </div>

                  {/* CTA */}
                  <Button
                    className="w-full mt-6 bg-primary text-primary-foreground hover:bg-forest-dark"
                    asChild
                  >
                    <Link href={`/booking?bundle=${bundle.id}`}>
                      Pesan Sekarang
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </Card>
            )
            })
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">
                Tidak ada paket tersedia saat ini
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
          >
            <Link href="/bundles">
              Lihat Semua Paket
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
