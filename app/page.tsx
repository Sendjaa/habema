import { HeroSection } from '@/components/home/hero-section'
import { FeaturedProducts } from '@/components/home/featured-products'
import { FeaturedBundles } from '@/components/home/featured-bundles'
import { CTA } from '@/components/home/cta-section'
import { AudienceSplitter } from '@/components/audienSplitter'
import { HabemaRefinedMap } from '@/components/about/route'

<link rel="preconnect" href="https://images.unsplash.com" />

export default async function Home() {
  return (
    <>
      <HeroSection />
      <FeaturedProducts />
      <AudienceSplitter />
      <FeaturedBundles />
      <CTA />
      {/* <HabemaRefinedMap /> */}
    </>
  )
}
