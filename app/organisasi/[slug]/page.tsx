import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { and, asc, eq, inArray } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { branches, bundles, clientOrganizations } from '@/lib/db/schema'

/**
 * Halaman dokumentasi instansi — tujuan tautan logo cloud homepage.
 *
 * Isinya sengaja hanya memakai data yang sudah ada: identitas instansi dari
 * client_organizations dan paket yang cocok dari bundles. Tidak ada tabel
 * konten baru; catatan consent_note instansi TIDAK ditampilkan — itu catatan
 * internal (siapa yang memberi izin, kapan), bukan bahan publikasi.
 */

/**
 * Paket mana yang relevan untuk sebuah sektor. "Paket Rental Grup" selalu
 * ikut karena itu paket rombongan lintas sektor; sisanya mengikuti kegiatan
 * yang biasa dipakai sektor tersebut.
 */
const AUDIENCES_BY_SECTOR: Record<string, string[]> = {
  Pendidikan: ['Paket Rental Grup', 'Camping Keluarga', 'Open Trip'],
  Komunitas: ['Paket Rental Grup', 'Open Trip', 'Private Camp'],
  Korporat: ['Paket Rental Grup', 'Private Camp', 'Campervan'],
  Yayasan: ['Paket Rental Grup', 'Camping Keluarga'],
  Pemerintah: ['Paket Rental Grup', 'Private Camp'],
}
const DEFAULT_AUDIENCES = ['Paket Rental Grup']

type Organization = typeof clientOrganizations.$inferSelect
type BundleRow = typeof bundles.$inferSelect

async function load(slug: string) {
  const db = getDb()

  const orgs = await db
    .select()
    .from(clientOrganizations)
    .where(
      and(eq(clientOrganizations.documentationSlug, slug), eq(clientOrganizations.isActive, true)),
    )
    .limit(1)

  const org = orgs[0]
  if (!org) return null

  const audiences = AUDIENCES_BY_SECTOR[org.sector ?? ''] ?? DEFAULT_AUDIENCES

  const [matchedBundles, branch] = await Promise.all([
    db
      .select()
      .from(bundles)
      .where(and(eq(bundles.isActive, true), inArray(bundles.targetAudience, audiences)))
      .orderBy(asc(bundles.bundlePrice)),
    db
      .select({ phone: branches.phone, name: branches.name })
      .from(branches)
      .where(eq(branches.isActive, true))
      .orderBy(asc(branches.createdAt))
      .limit(1)
      .then((rows) => rows[0]),
  ])

  return { org, matchedBundles, branch }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  try {
    const data = await load(slug)
    if (!data) return { title: 'Instansi tidak ditemukan — Habema Outdoor' }
    const { org } = data
    return {
      title: `${org.name} — Habema Outdoor`,
      description:
        `${org.name} menyewa peralatan outdoor di Habema. ` +
        `Paket rental yang cocok untuk instansi sejenis, lengkap dengan isi tiap paket.`,
    }
  } catch {
    return { title: 'Instansi — Habema Outdoor' }
  }
}

export default async function OrganizationPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  let data: Awaited<ReturnType<typeof load>> = null

  try {
    data = await load(slug)
  } catch (e) {
    console.error('[organisasi] query gagal:', e instanceof Error ? e.message : e)
  }

  if (!data) notFound()

  const { org, matchedBundles, branch } = data
  const waPhone = branch?.phone?.replace(/[^0-9]/g, '') ?? ''

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b border-border bg-cream-dark">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <Link
            href="/"
            className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-forest"
          >
            ← Habema Outdoor
          </Link>

          <div className="mt-5 flex items-start gap-5">
            {org.logoUrl && (
              // logo_url diisi admin dari host mana pun, jadi tidak lewat
              // next/image yang domainnya dibatasi remotePatterns.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={org.logoUrl}
                alt={`Logo ${org.name}`}
                className="h-16 w-16 md:h-20 md:w-20 object-contain rounded-xl bg-card border border-border p-2 shrink-0"
              />
            )}
            <div className="min-w-0">
              {org.sector && (
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">
                  {org.sector}
                </p>
              )}
              <h1 className="mt-2 text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tight text-stone-900 leading-[0.95]">
                {org.name}
              </h1>
              <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-2xl">
                {org.name} adalah salah satu instansi yang mempercayai penyewaan
                peralatan outdoor kepada Habema. Halaman ini mencatat kerja sama
                tersebut dan paket yang paling sering dipakai instansi sejenis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {matchedBundles.length > 0 && (
        <section className="py-14 md:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-stone-900">
              Paket yang cocok
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Paket rombongan dengan komposisi alat yang sudah dihitung per orang.
            </p>

            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {matchedBundles.map((bundle: BundleRow) => (
                <li key={bundle.id}>
                  <Link
                    href={`/packages/${bundle.id}`}
                    className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-wider text-forest">
                        {bundle.targetAudience}
                      </span>
                      {bundle.paxMin != null && (
                        <span className="text-[11px] text-muted-foreground">
                          {bundle.paxMax != null && bundle.paxMax !== bundle.paxMin
                            ? `${bundle.paxMin}–${bundle.paxMax} orang`
                            : `${bundle.paxMin} orang`}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-2 text-lg font-black text-stone-900 leading-tight">
                      {bundle.name}
                    </h3>

                    {bundle.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {bundle.description}
                      </p>
                    )}

                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-xl font-black text-forest">
                        Rp{Math.round(Number(bundle.bundlePrice)).toLocaleString('id-ID')}
                      </span>
                      <span className="text-[11px] text-muted-foreground">/ paket / malam</span>
                      {bundle.originalPrice != null &&
                        Number(bundle.originalPrice) > Number(bundle.bundlePrice) && (
                          <span className="text-[11px] text-muted-foreground line-through">
                            Rp{Math.round(Number(bundle.originalPrice)).toLocaleString('id-ID')}
                          </span>
                        )}
                    </div>

                    {Array.isArray(bundle.includes) && bundle.includes.length > 0 && (
                      <p className="mt-3 text-[11px] text-muted-foreground">
                        Termasuk {bundle.includes.length} baris alat — lihat rinciannya
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="border-t border-border py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div>
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-stone-900">
              Rencanakan kegiatan seperti {org.name}?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ceritakan jumlah peserta dan tanggalnya — tim cabang menyiapkan
              daftar alat beserta stok per cabang{branch?.name ? ` (${branch.name})` : ''}.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            {waPhone && (
              <a
                href={`https://wa.me/${waPhone}?text=${encodeURIComponent(
                  `Halo Habema Outdoor, saya dari ${org.name} ingin menanyakan paket rental untuk kegiatan kami.`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 h-12 rounded-xl font-bold text-white bg-forest hover:bg-forest-dark transition-colors"
              >
                Hubungi via WhatsApp
              </a>
            )}
            <Link
              href="/catalog_rental"
              className="inline-flex items-center justify-center px-6 h-12 rounded-xl font-bold text-forest bg-card border border-border hover:border-forest transition-colors"
            >
              Lihat Katalog Alat
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
