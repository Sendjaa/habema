/**
 * Tipe dan utilitas bersama untuk Shop Hero — bisa dipakai client & server.
 */

export interface ShopHeroMedia {
  url: string
  alt?: string
}

export interface ShopHeroStats {
  value: string
  label: string
}

export interface ShopHeroContent {
  kicker: string
  heading: string
  description: string
  stats: ShopHeroStats[]
  ctaLabel: string
  ctaHref: string
  secondaryCtaLabel: string
  secondaryCtaHref: string
  note: string
  media: ShopHeroMedia[]
}

export function isHeroVideo(url: string) {
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url)
}

/** Fallback statis jika DB kosong / error */
export const shopHeroContent: ShopHeroContent = {
  kicker: "Habema Official Store",
  heading: "Gear Kuat Buat Jelajah Tanpa Ribet",
  description:
    "Tenda, carrier, cooking set, dan perlengkapan jalan lainnya kami pilih sendiri satu per satu. Tahan pakai, harga masuk, siap dikirim dari Bandung.",
  stats: [
    { value: "500+", label: "Kurasi Gear" },
    { value: "7 Hari", label: "Garansi Tukar" },
    { value: "100%", label: "Produk Original" },
  ],
  ctaLabel: "Mulai Belanja",
  ctaHref: "/catalog_shop",
  secondaryCtaLabel: "Bundling Hemat",
  secondaryCtaHref: "/bundles",
  note: "Produk original dengan garansi tukar 7 hari. Pembayaran aman via Midtrans.",
  media: [],
}