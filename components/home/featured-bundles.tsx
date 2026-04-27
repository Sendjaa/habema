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
    const { data, error } = await supabase
      .from('bundles')
      .select('*')
      // .eq('is_featured', true)

    if (error) {
      console.error('Error fetching featured bundles:', error)
      return []
    }
    return data || []
  }

  const [bundles, setBundles] = React.useState<any[]>([])

  React.useEffect(() => {
    fetchFeaturedBundles().then(setBundles)
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
          {Array.isArray(bundles) && bundles.length > 0 ? (
            bundles.map((bundle) => {
              const savings = (bundle.originalPrice || 0) - (bundle.bundlePrice || 0)
              const savingsPercent = bundle.originalPrice ? Math.round((savings / bundle.originalPrice) * 100) : 0

            return (
              <Card
                key={bundle.id}
                className={`overflow-hidden border-2 transition-all hover:shadow-xl hover:-translate-y-1 ${
                  bundle.category === 'experienced'
                    ? 'border-gold bg-white'
                    : 'border-border bg-white'
                }`}
              >
                {/* Ribbon */}
                {bundle.category === 'experienced' && (
                  <div className="absolute top-0 right-0 bg-gold text-forest px-4 py-1 text-xs font-bold rounded-bl-lg z-10">
                    ⭐ POPULER
                  </div>
                )}

                <div className="p-6 space-y-6">
                  {/* Header */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-forest mb-2">
                          {bundle.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {bundle.description}
                        </p>
                      </div>
                      <span className="text-4xl">{bundle.icon}</span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                      Berisi:
                    </p>
                    <div className="space-y-1">
                      {Array.isArray(bundle.items) ? bundle.items.map((item: { quantity: number }, idx: number) => (
                        <div key={idx} className="text-sm text-foreground flex items-center gap-2">
                          <span className="text-gold">•</span>
                          {item.quantity}x item
                        </div>
                      )) : []}
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="space-y-2 pt-4 border-t border-border">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-muted-foreground">Harga Normal:</span>
                      <span className="line-through text-muted-foreground">
                        Rp{bundle.originalPrice.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-semibold text-forest">Harga Paket:</span>
                      <span className="text-2xl font-bold text-gold">
                        Rp{bundle.bundlePrice.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-gold" />
                      <span className="text-sm font-semibold text-gold">
                        Hemat Rp{savings.toLocaleString('id-ID')} ({savingsPercent}%)
                      </span>
                    </div>
                  </div>

                  {/* Difficulty Badge */}
                  <div className="pt-2">
                    <Badge
                      className={`${
                        bundle.category === 'beginner'
                          ? 'bg-green-100 text-green-800'
                          : bundle.category === 'experienced'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {bundle.category === 'beginner' && '🌱 Pemula'}
                      {bundle.category === 'experienced' && '⛺ Berpengalaman'}
                      {bundle.category === 'professional' && '🏔️ Profesional'}
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
                Memuat data paket...
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
