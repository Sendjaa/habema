import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Fragment } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { and, arrayContains, asc, desc, eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { bundles, equipment, shopProducts } from '@/lib/db/schema'
import {
  defaultActivitySections,
  getActivity,
  type ActivitySection,
} from '@/lib/activities'
import { ActivitySectionTabs } from '@/components/kegiatan/activity-section-tabs'

/**
 * Halaman kegiatan — satu tempat untuk "saya mau <kegiatan>, butuh apa saja?".
 *
 * Dua lini bisnis Habema bertemu di sini: alat sewa (equipment) dan barang
 * beli (shop_products) sama-sama ditandai dengan slug dari lib/activities.ts.
 * Katalog biasa tetap memisahkan keduanya — halaman ini justru yang
 * menggabungkan, karena orang datang dengan rencana, bukan dengan jenis
 * transaksi.
 *
 * Bentuknya tidak seragam untuk semua kegiatan: open trip dijual sebagai
 * keberangkatan, jadi paket memimpin dan barang beli tidak muncul sama
 * sekali. Yang mengatur itu Activity.sections, bukan percabangan per slug di
 * sini.
 *
 * Server component: halaman ini yang dicari orang di Google, jadi kontennya
 * harus ada di HTML pertama.
 */

const GEAR_LIMIT = 8
const PRODUCT_LIMIT = 8

const rupiah = (value: string | number | null | undefined) =>
  `Rp${Math.round(Number(value ?? 0)).toLocaleString('id-ID')}`

async function load(slug: string) {
  const activity = getActivity(slug)
  if (!activity) return null

  const db = getDb()

  const [gearRows, productRows, bundleRows] = await Promise.all([
    db
      .select({
        id: equipment.id,
        name: equipment.name,
        brand: equipment.brand,
        imageUrl: equipment.imageUrl,
        pricePerNight: equipment.pricePerNight,
        promoPricePerNight: equipment.promoPricePerNight,
        isPromo: equipment.isPromo,
        stockQuantity: equipment.stockQuantity,
        rentalCount: equipment.rentalCount,
      })
      .from(equipment)
      .where(
        and(
          eq(equipment.isActive, true),
          eq(equipment.isAvailable, true),
          arrayContains(equipment.activities, [slug]),
        ),
      )
      // Alat yang paling sering disewa untuk kegiatan ini paling dulu.
      .orderBy(desc(equipment.rentalCount), asc(equipment.name))
      .limit(GEAR_LIMIT),
    db
      .select({
        id: shopProducts.id,
        name: shopProducts.name,
        brand: shopProducts.brand,
        imageUrl: shopProducts.imageUrl,
        price: shopProducts.price,
        originalPrice: shopProducts.originalPrice,
        stock: shopProducts.stock,
      })
      .from(shopProducts)
      .where(
        and(
          eq(shopProducts.isAvailable, true),
          arrayContains(shopProducts.activities, [slug]),
        ),
      )
      .orderBy(desc(shopProducts.soldCount), asc(shopProducts.name))
      .limit(PRODUCT_LIMIT),
    // bundles.target_audience memakai label yang sama dengan kegiatan.
    db
      .select({
        id: bundles.id,
        name: bundles.name,
        description: bundles.description,
        targetAudience: bundles.targetAudience,
        bundlePrice: bundles.bundlePrice,
        originalPrice: bundles.originalPrice,
        paxMin: bundles.paxMin,
        paxMax: bundles.paxMax,
      })
      .from(bundles)
      .where(and(eq(bundles.isActive, true), eq(bundles.targetAudience, activity.label)))
      .orderBy(asc(bundles.bundlePrice))
      .limit(3),
  ])

  return {
    activity,
    gear: gearRows.filter((g) => g.id && g.name),
    products: productRows.filter((p) => p.name),
    packageBundles: bundleRows.filter((b) => b.id && b.name),
  }
}

type PageData = NonNullable<Awaited<ReturnType<typeof load>>>

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const activity = getActivity(slug)
  if (!activity) return { title: 'Kegiatan tidak ditemukan — Habema Outdoor' }

  return {
    title: `${activity.label} — Alat Sewa & Perlengkapan | Habema Outdoor`,
    description:
      `${activity.blurb}. Pilihan alat sewa dan perlengkapan untuk ${activity.label.toLowerCase()}, ` +
      'lengkap dengan paket rombongan.',
  }
}

function SectionHeading({ kicker, title, note }: { kicker: string; title: string; note: string }) {
  return (
    <>
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-orange-600">{kicker}</p>
      <h2 className="mt-2 font-sans text-2xl md:text-4xl lg:text-6xl font-bold uppercase tracking-tight text-stone-900">
        {title}
      </h2>
      <p className="mt-2 text-sm text-stone-500 max-w-2xl">{note}</p>
    </>
  )
}

function SectionCta({ href, children }: { href: string; children: ReactNode }) {
  return (
    <div className="mt-6">
      <Link
        href={href}
        className="inline-flex items-center justify-center px-6 h-12 rounded-xl font-bold text-orange-700 bg-white border border-orange-200 hover:border-orange-500 hover:bg-orange-50 transition-colors"
      >
        {children}
      </Link>
    </div>
  )
}

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  let data: PageData | null = null

  try {
    data = await load(slug)
  } catch (e) {
    console.error('[kegiatan] query gagal:', e instanceof Error ? e.message : e)
  }

  if (!data) notFound()

  const { activity, gear, products, packageBundles } = data
  const order = activity.sections ?? defaultActivitySections
  // Kegiatan yang katalognya keberangkatan memakai istilah "jadwal", bukan
  // "paket rombongan", dan menghitung harganya per orang.
  const packagesLead = order[0] === 'packages'

  const sections: Record<ActivitySection, ReactNode> = {
    gear:
      gear.length > 0 ? (
        <section className="py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              kicker={order.includes('products') ? 'Sewa atau beli' : 'Peralatan sewa'}
              title={`Alat untuk ${activity.label}`}
              note="Harga sewa per malam dengan ketersediaan mengikuti stok cabang. Satu hari sewa dihitung 24 jam sejak alat diambil."
            />

            <ul className="mt-8 grid gap-4 grid-cols-2 lg:grid-cols-4">
              {gear.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/product/${item.id}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-all hover:border-orange-300 hover:shadow-md"
                  >
                    <div className="relative aspect-square bg-stone-100">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name ?? ''}
                          fill
                          sizes="(max-width: 1024px) 50vw, 25vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center text-[11px] text-stone-500">
                          Tanpa foto
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-3">
                      {item.brand && (
                        <p className="text-[9px] uppercase tracking-widest text-stone-500">
                          {item.brand}
                        </p>
                      )}
                      <h3 className="mt-1 font-sans text-xs md:text-sm font-bold text-stone-900 leading-tight line-clamp-2">
                        {item.name}
                      </h3>
                      <div className="mt-auto pt-2">
                        <p className="text-sm font-black text-orange-700">
                          {rupiah(item.isPromo ? item.promoPricePerNight : item.pricePerNight)}
                        </p>
                        <p className="text-[10px] text-stone-500">/ malam</p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            <SectionCta href={`/catalog_rental?kegiatan=${activity.slug}`}>
              Lihat semua alat untuk {activity.label}
            </SectionCta>
          </div>
        </section>
      ) : null,

    products:
      products.length > 0 ? (
        <section className="border-t border-orange-100 py-12 md:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              kicker="Perlengkapan pribadi"
              title={`Perlengkapan yang biasa dibeli untuk ${activity.label.toLowerCase()}`}
              note="Perlengkapan yang umumnya dibeli sendiri karena bersifat habis pakai atau pribadi, sehingga tidak disewakan."
            />

            <ul className="mt-8 grid gap-4 grid-cols-2 lg:grid-cols-4">
              {products.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/product/${item.id}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-all hover:border-orange-300 hover:shadow-md"
                  >
                    <div className="relative aspect-square bg-stone-100">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          sizes="(max-width: 1024px) 50vw, 25vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center text-[11px] text-stone-500">
                          Tanpa foto
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-3">
                      {item.brand && (
                        <p className="text-[9px] uppercase tracking-widest text-stone-500">
                          {item.brand}
                        </p>
                      )}
                      <h3 className="mt-1 font-sans text-xs md:text-sm font-bold text-stone-900 leading-tight line-clamp-2">
                        {item.name}
                      </h3>
                      <div className="mt-auto pt-2">
                        <p className="text-sm font-black text-orange-700">{rupiah(item.price)}</p>
                        {item.originalPrice && Number(item.originalPrice) > Number(item.price) && (
                          <p className="text-[10px] text-stone-500 line-through">
                            {rupiah(item.originalPrice)}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            <SectionCta href="/catalog_shop">Buka katalog toko</SectionCta>
          </div>
        </section>
      ) : null,

    packages:
      packageBundles.length > 0 ? (
        <section className="py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              kicker={packagesLead ? 'Keberangkatan' : 'Paket untuk rombongan'}
              title={packagesLead ? `Jadwal ${activity.label}` : 'Paket peralatan rombongan'}
              note={
                packagesLead
                  ? 'Harga per orang sudah termasuk peralatan. Pilih keberangkatan; kuota dikonfirmasi oleh tim cabang.'
                  : 'Komposisi alat sudah dihitung untuk rombongan, sehingga tidak perlu menyusun satu per satu.'
              }
            />

            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {packageBundles.map((bundle) => (
                <li key={bundle.id}>
                  <Link
                    href={`/packages/${bundle.id}`}
                    className="flex h-full flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition-all hover:border-orange-300 hover:shadow-md"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-wider text-orange-700">
                        {bundle.targetAudience}
                      </span>
                      {bundle.paxMin != null && (
                        <span className="text-[11px] text-stone-500">
                          {bundle.paxMax != null && bundle.paxMax !== bundle.paxMin
                            ? `${bundle.paxMin}–${bundle.paxMax} orang`
                            : `${bundle.paxMin} orang`}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2 font-sans text-lg font-bold text-stone-900 leading-tight">
                      {bundle.name}
                    </h3>
                    {bundle.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-stone-500">
                        {bundle.description}
                      </p>
                    )}
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-xl font-black text-orange-700">
                        {rupiah(bundle.bundlePrice)}
                      </span>
                      <span className="text-[11px] text-stone-500">
                        {packagesLead ? '/ orang' : '/ paket / malam'}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            {/* /opentrip sudah mengelompokkan paket dengan label yang sama,
                jadi halaman kegiatan tidak membawa daftar jadwal sendiri. */}
            <SectionCta href="/opentrip">Lihat semua paket &amp; jadwal</SectionCta>
          </div>
        </section>
      ) : null,
  }

  const sectionMeta: Record<ActivitySection, { label: string; count: number }> = {
    gear: { label: 'Alat Sewa', count: gear.length },
    products: { label: 'Perlengkapan', count: products.length },
    packages: { label: packagesLead ? 'Jadwal' : 'Paket', count: packageBundles.length },
  }

  const availableSections = order.flatMap((key) => {
    const node = sections[key]
    if (!node) return []
    return [{ key, ...sectionMeta[key], node }]
  })

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-10 pb-2">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-widest"
          >
            <Link href="/" className="text-orange-700 hover:text-orange-800">
              Aktivitas
            </Link>
            <span className="text-stone-300" aria-hidden="true">
              /
            </span>
            <span className="text-stone-500">{activity.label}</span>
          </nav>
          <h1 className="mt-3 font-sans text-3xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-stone-900 leading-[0.95]">
            {activity.label}
          </h1>
        </div>
      </header>

      {availableSections.length > 1 ? (
        <ActivitySectionTabs sections={availableSections} />
      ) : (
        availableSections.map(({ key, node }) => <Fragment key={key}>{node}</Fragment>)
      )}

      {availableSections.length === 0 && (
        <section className="py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="font-sans text-2xl md:text-4xl lg:text-6xl font-bold uppercase tracking-tight text-stone-900">
              Katalog {activity.label} sedang disusun
            </h2>
            <p className="mt-3 text-sm text-stone-500">
              Sampaikan kebutuhan kegiatan Anda; tim cabang akan menyiapkan daftar alat beserta
              ketersediaan stok.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/catalog_rental"
                className="inline-flex items-center justify-center px-6 h-12 rounded-xl font-bold text-white bg-orange-600 hover:bg-orange-700 transition-colors"
              >
                Lihat katalog alat
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 h-12 rounded-xl font-bold text-orange-700 bg-white border border-orange-200 hover:border-orange-500 hover:bg-orange-50 transition-colors"
              >
                Tanya tim cabang
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
