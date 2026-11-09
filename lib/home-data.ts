/**
 * Payload /api/home — section homepage yang membaca data sekaligus (LogoCloud,
 * ActivityCategories, PromoBanners) dalam satu request.
 *
 * Cache-nya ikut pindah ke sini dari route handler-nya karena dua alasan:
 * homepage membacanya tiap request, dan /api/admin/activities perlu
 * membuangnya setelah foto tile diubah. Route handler tidak boleh
 * mengekspor apa pun di samping handler + konfigurasi (Next menandai
 * typenya sebagai "non-standard export"), jadi tempatnya memang di lib.
 */

export type HomePayload = {
  activities: {
    slug: string
    label: string
    blurb: string
    /** Jumlah alat aktif yang tag kegiatannya memuat slug ini. */
    count: number
    imageUrl: string
    /** null = foto tile tidak punya alt sendiri; UI memakai label. */
    imageAlt: string | null
  }[]
  organizations: {
    id: string
    name: string
    logoUrl: string | null
    sector: string | null
    documentationSlug: string | null
  }[]
  /**
   * Banner promo: gambar kampanye saja, bukan produk. Baris `promo_banners`
   * yang aktif dan sedang dalam jadwal, dikelola dari /admin/promo-banners.
   */
  banners: {
    id: string
    title: string
    imageUrl: string
    /** null = banner tidak bisa diklik. */
    linkUrl: string | null
  }[]
}

const CACHE_TTL = 5 * 60 * 1000
let cached: { body: HomePayload; at: number } | null = null

export function getCachedHome(): HomePayload | null {
  return cached && Date.now() - cached.at < CACHE_TTL ? cached.body : null
}

export function setCachedHome(body: HomePayload) {
  cached = { body, at: Date.now() }
}

/**
 * Buang cache. Dipanggil setelah admin mengubah isi homepage (mis. foto tile
 * kegiatan di /admin/activities) supaya perubahan langsung terlihat, bukan
 * setelah 5 menit.
 */
export function revalidateHome() {
  cached = null
}
