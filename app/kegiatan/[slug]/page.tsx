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
  if (!activity) return { title: 'Kegiatan tidak ditemukan | Habema Outdoor' }

  return {
    title: `${activity.label} | Alat Sewa & Perlengkapan | Habema Outdoor`,
    description:
      `${activity.blurb}. Pilihan alat sewa dan perlengkapan untuk ${activity.label.toLowerCase()}, ` +
      'lengkap dengan paket rombongan.',
  }
}

function SectionHeading({
  kicker,
  title,
  note,
  count,
}: {
  kicker: string
  title: string
  note: string
  count?: number
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-orange-700">{kicker}</p>
        <h2 className="mt-2 font-sans text-2xl md:text-3xl lg:text-4xl font-bold uppercase tracking-tight text-stone-900">
          {title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">{note}</p>
      </div>
      {count != null && (
        <span className="inline-flex shrink-0 items-center rounded-full border border-orange-200 bg-orange-50 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-orange-800">
          {count} pilihan
        </span>
      )}
    </div>
  )
}

type CatalogCardProps = {
  id: string | number
  name: string
  brand: string | null
  imageUrl: string | null
  price: number
  originalPrice?: number | null
  discountLabel?: string
  stockNote?: string
  unit?: string
}

function CatalogCard({
  id,
  name,
  brand,
  imageUrl,
  price,
  originalPrice,
  discountLabel,
  stockNote,
  unit,
}: CatalogCardProps) {
  return (
    <Link
      href={`/product/${id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-colors hover:border-orange-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
    >
      <div className="relative aspect-square bg-stone-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="(max-width: 1023px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-[11px] text-stone-600">
            Tanpa foto
          </span>
        )}
        {discountLabel && (
          <span className="absolute left-3 top-3 rounded-md bg-orange-700 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
            {discountLabel}
          </span>
        )}
        {stockNote && (
          <span className="absolute right-3 top-3 rounded-md border border-orange-200 bg-orange-50 px-2 py-1 text-[10px] font-bold text-orange-800">
            {stockNote}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        {brand && (
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-600">
            {brand}
          </p>
        )}
        <h3 className="mt-1.5 line-clamp-2 text-sm font-bold leading-snug text-stone-900">
          {name}
        </h3>
        <div className="mt-auto pt-4">
          <p className="text-sm font-black text-orange-700">
            {rupiah(price)}
            {unit && (
              <span className="ml-1 text-[11px] font-semibold text-stone-600">/{unit}</span>
            )}
          </p>
          {originalPrice != null && originalPrice > price && (
            <p className="mt-0.5 text-[11px] text-stone-600 line-through">
              {rupiah(originalPrice)}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}

function SectionCta({ href, children }: { href: string; children: ReactNode }) {
  return (
    <div className="mt-6">
      <Link
        href={href}
                className="inline-flex h-12 items-center justify-center rounded-xl border border-orange-200 bg-white px-6 font-bold text-orange-700 transition-colors hover:border-orange-500 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
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
              count={gear.length}
            />

            <ul className="mt-8 grid gap-4 grid-cols-2 lg:grid-cols-4">
              {gear.map((item) => {
                const normalPrice = Number(item.pricePerNight ?? 0)
                const promoPrice = Number(item.promoPricePerNight ?? 0)
                const hasPromo =
                  item.isPromo === true && promoPrice > 0 && promoPrice < normalPrice
                const price = hasPromo ? promoPrice : normalPrice
                const discount = hasPromo
                  ? Math.round(((normalPrice - promoPrice) / normalPrice) * 100)
                  : 0
                const stock = item.stockQuantity
                const stockNote =
                  stock != null && stock <= 3
                    ? stock === 0
                      ? 'Stok habis'
                      : `Sisa ${stock}`
                    : undefined

                return (
                  <li key={item.id}>
                    <CatalogCard
                      id={item.id}
                      name={item.name ?? 'Alat sewa'}
                      brand={item.brand}
                      imageUrl={item.imageUrl}
                      price={price}
                      originalPrice={discount > 0 ? normalPrice : null}
                      discountLabel={discount > 0 ? `-${discount}%` : undefined}
                      stockNote={stockNote}
                      unit="malam"
                    />
                  </li>
                )
              })}
            </ul>

            <SectionCta href={`/catalog_rental?kegiatan=${activity.slug}`}>
              Lihat semua alat untuk {activity.label}
            </SectionCta>
          </div>
        </section>
      ) : null,

    products:
      products.length > 0 ? (
        <section className="bg-orange-50/40 py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              kicker="Perlengkapan pribadi"
              title={`Perlengkapan yang biasa dibeli untuk ${activity.label.toLowerCase()}`}
              note="Perlengkapan yang umumnya dibeli sendiri karena bersifat habis pakai atau pribadi, sehingga tidak disewakan."
              count={products.length}
            />

            <ul className="mt-8 grid gap-4 grid-cols-2 lg:grid-cols-4">
              {products.map((item) => {
                const price = Number(item.price ?? 0)
                const originalPrice = Number(item.originalPrice ?? 0)
                const hasDiscount = originalPrice > price
                const discount = hasDiscount
                  ? Math.round(((originalPrice - price) / originalPrice) * 100)
                  : 0
                const stock = item.stock
                const stockNote =
                  stock != null && stock <= 3
                    ? stock === 0
                      ? 'Stok habis'
                      : `Sisa ${stock}`
                    : undefined

                return (
                  <li key={item.id}>
                    <CatalogCard
                      id={item.id}
                      name={item.name}
                      brand={item.brand}
                      imageUrl={item.imageUrl}
                      price={price}
                      originalPrice={discount > 0 ? originalPrice : null}
                      discountLabel={discount > 0 ? `-${discount}%` : undefined}
                      stockNote={stockNote}
                    />
                  </li>
                )
              })}
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
              count={packageBundles.length}
            />

            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {packageBundles.map((bundle) => (
                <li key={bundle.id}>
                  <Link
                    href={`/packages/${bundle.id}`}
                    className="flex h-full flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition-colors hover:border-orange-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-orange-700">
                        {bundle.targetAudience}
                      </span>
                      {bundle.paxMin != null && (
                        <span className="text-[11px] text-stone-600">
                          {bundle.paxMax != null && bundle.paxMax !== bundle.paxMin
                            ? `${bundle.paxMin}-${bundle.paxMax} orang`
                            : `${bundle.paxMin} orang`}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2 font-sans text-lg font-bold text-stone-900 leading-tight">
                      {bundle.name}
                    </h3>
                    {bundle.description && (
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-stone-600">
                        {bundle.description}
                      </p>
                    )}
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-xl font-black text-orange-700">
                        {rupiah(bundle.bundlePrice)}
                      </span>
                      <span className="text-[11px] text-stone-600">
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
      <header className="border-b border-orange-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8 md:pt-10 md:pb-10">
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
            <span className="text-stone-600" aria-current="page">
              {activity.label}
            </span>
          </nav>

          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-orange-700">
                Katalog kegiatan
              </p>
              <h1 className="mt-3 font-sans text-4xl font-bold uppercase leading-[0.95] tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
                {activity.label}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-stone-600 md:text-base">
                {activity.blurb}.
              </p>
            </div>

            <aside className="border-t-2 border-orange-600 pt-4 lg:border-l-2 lg:border-t-0 lg:pl-5 lg:pt-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-stone-600">
                Sebelum berangkat
              </p>
              <p className="mt-2 text-sm leading-relaxed text-stone-700">
                Ketersediaan alat mengikuti jadwal sewa di cabang. Cek stok sebelum menentukan
                tanggal pengambilan.
              </p>
              <Link
                href="/contact"
                className="mt-3 inline-flex text-xs font-bold uppercase tracking-wider text-orange-700 underline decoration-orange-300 underline-offset-4 hover:text-orange-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
              >
                Hubungi tim cabang
              </Link>
            </aside>
          </div>
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
            <h2 className="font-sans text-2xl font-bold uppercase tracking-tight text-stone-900 md:text-4xl">
              Katalog {activity.label} sedang disusun
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-stone-600">
              Sampaikan kebutuhan kegiatan Anda; tim cabang akan menyiapkan daftar alat beserta
              ketersediaan stok.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/catalog_rental"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-orange-700 px-6 font-bold text-white transition-colors hover:bg-orange-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
              >
                Lihat katalog alat
              </Link>
              <Link
                href="/contact"
        className="inline-flex h-12 items-center justify-center rounded-xl border border-orange-200 bg-white px-6 font-bold text-orange-700 transition-colors hover:border-orange-500 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
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
