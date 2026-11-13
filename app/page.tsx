export const dynamic = 'force-dynamic'

import { HeroSectionFull } from '@/components/home/hero-section-full'
import { LogoCloud } from '@/components/home/logo-cloud'
import { ActivityCategories } from '@/components/home/activity-categories'
import { PromoBanners } from '@/components/home/promo-banners'
import { VoucherSection } from '@/components/home/voucher-section'
import { FeaturedProducts } from '@/components/home/featured-products'
import { FeaturedBundles } from '@/components/home/featured-bundles'
import { ShopHeroSection } from '@/components/home/shop-hero-section'
import { ShopProducts } from '@/components/home/shop-products'
import { CTA } from '@/components/home/cta-section'
import { FirstVisitPrompt } from '@/components/home/first-visit-prompt'

export default async function Home() {
  return (
    <>
      <HeroSectionFull />
      {/* <LogoCloud /> */}
      <VoucherSection />
      <ActivityCategories />
      <PromoBanners />
      <FeaturedProducts />
      <ShopHeroSection />
      <ShopProducts />
      <FeaturedBundles />
      <CTA />
      <FirstVisitPrompt />
    </>
  )
}
