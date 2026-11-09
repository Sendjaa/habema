import { getShopHero } from '@/lib/shop-hero'
import { ShopHeroCarousel } from '@/components/home/shop-hero-carousel'
import { ShopHeroThumbnails } from '@/components/home/shop-hero-thumbnails'
import Link from 'next/link'
import { ArrowRight, Package, ShieldCheck, ShoppingBag } from 'lucide-react'

/** Server component: Hero ShopProducts — ambil data dari DB, fallback ke statis */
export async function ShopHeroSection() {
  const content = await getShopHero()
  const { media, ...rest } = content

  return (
    <div className="relative mx-auto max-w-7xl overflow-hidden px-4 pb-12 pt-2 md:px-6 mb:py-5 lg:h-[70vh] py-4 md:py-4">
      <div className="relative grid grid-cols-1 gap-6 lg:h-full lg:grid-cols-2">
        {/* Kiri: carousel image + video, rasio 1080x1350 */}
        <ShopHeroCarousel media={media} heading={rest.heading} />

        {/* Kanan: heading, shopImage, deskripsi, button, dll */}
        <div className="relative space-y-4 lg:h-full lg:overflow-y-auto lg:pr-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="space-y-1.5">
            <h3 className="text-2xl md:text-4xl lg:text-6xl font-bold font-sans leading-tight tracking-tight text-black md:text-3xl">
              {rest.heading}
            </h3>
            <div className="flex flex-wrap gap-x-6 gap-y-1.5 pt-1">
              {rest.stats.map((stat) => (
                <div key={stat.label} className="flex flex-col">
                  <span className="text-base font-black text-black">{stat.value}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-black">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* shopImage: thumbnail, sinkron dengan carousel kiri */}
          {media.length > 1 && <ShopHeroThumbnails media={media} heading={rest.heading} />}

          <div>
            <p className="line-clamp-4 whitespace-pre-line text-sm leading-relaxed text-black">{rest.description.trim()}</p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              href={rest.ctaHref}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-forest px-7 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-forest/90 sm:flex-none"
            >
              <ShoppingBag className="h-4 w-4" />
              {rest.ctaLabel}
            </Link>
            <Link
              href={rest.secondaryCtaHref}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-7 py-3 text-xs font-bold uppercase tracking-wider text-stone-700 transition-colors hover:bg-stone-50 sm:flex-none"
            >
              {rest.secondaryCtaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}