'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useHomeData } from './use-home-data'

/**
 * Banner promo di homepage.
 *
 * Isinya gambar kampanye saja — tidak ada nama alat, harga, atau badge diskon
 * di sini. Dulu section ini menurunkan kartunya dari equipment.is_promo,
 * sehingga yang tampil adalah daftar produk kedua di halaman yang sama
 * (Gear Terfavorit sudah memuat produknya). Gambar banner dikelola dari
 * /admin/promo-banners, lengkap dengan jadwal tayang dan tautan opsional.
 *
 * Banner tanpa tautan tetap tayang sebagai gambar — ini banner, bukan tombol,
 * jadi tidak wajib mengarah ke mana pun. Section menyembunyikan dirinya saat
 * tidak ada banner aktif (return null), sama seperti section lain.
 */
export function PromoBanners() {
  const { home } = useHomeData()
  const banners = home?.banners ?? []

  if (banners.length === 0) return null

  return (
    <section className="py-6 md:py-10 bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <h2 className="text-4xl py-2 md:py-4 md:text-5xl lg:text-6xl font-black text-stone-900 tracking-tighter leading-[0.9]">
          <span>Promo</span>
        </h2>
        <div
          className={
            banners.length > 1
              ? 'grid gap-3 md:grid-cols-2 md:gap-4'
              : 'grid gap-3 md:gap-4'
          }
        >
          {banners.map((banner) => (
            <BannerCard
              key={banner.id}
              banner={banner}
              sizes={
                banners.length > 1
                  ? '(min-width: 1280px) 600px, (min-width: 768px) 50vw, 100vw'
                  : '(min-width: 1280px) 1216px, 100vw'
              }
            />
          ))}
        </div>
      </div>
    </section>
  )
}

type Banner = NonNullable<ReturnType<typeof useHomeData>['home']>['banners'][number]

function BannerCard({ banner, sizes }: { banner: Banner; sizes: string }) {
  const frame =
    'group relative block aspect-16/9 w-full overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md'

  const image = banner.imageUrl ? (
    <Image
      src={banner.imageUrl}
      alt={banner.title}
      fill
      sizes={sizes}
      className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
    />
  ) : null

  if (!banner.linkUrl) {
    return <div className={frame}>{image}</div>
  }

  if (banner.linkUrl.startsWith('/')) {
    return (
      <Link href={banner.linkUrl} className={frame} aria-label={banner.title}>
        {image}
      </Link>
    )
  }

  return (
    <a
      href={banner.linkUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={frame}
      aria-label={banner.title}
    >
      {image}
    </a>
  )
}
