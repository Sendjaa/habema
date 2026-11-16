import type { Metadata } from 'next'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import ContactForm, { type ContactBranch } from '@/components/contact/contact-form'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Hubungi Habema',
  description:
    'Hubungi tim Habema lewat WhatsApp atau telepon, dan temukan lokasi Habema di Bandung Raya.',
}

const INSTAGRAM_URL =
  'https://www.instagram.com/habemaoutdoor?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=='

function waNumber(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '')
  if (digits.startsWith('0')) return `62${digits.slice(1)}`
  if (digits.startsWith('62')) return digits
  return `62${digits}`
}

function waHref(phone: string): string {
  return `https://wa.me/${waNumber(phone)}`
}

function phoneHref(phone: string): string {
  return `tel:+${waNumber(phone)}`
}

function branchOrder(name: string): number {
  const match = name.match(/\(cabang\s*(\d+)\)/i)
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER
}

function displayBranchName(name: string): string {
  return name.replace(/\s*\(cabang\s*\d+\)\s*$/i, '').trim()
}

async function loadBranches(): Promise<ContactBranch[]> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('branches')
      .select('id, name, address, city, phone, operational_hours, map_url')
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) throw new Error(error.message)

    return (data ?? []).map((branch) => ({
      id: branch.id,
      name: branch.name,
      address: branch.address,
      city: branch.city,
      phone: branch.phone,
      operationalHours: branch.operational_hours,
      mapUrl: branch.map_url,
    }))
  } catch (error) {
    console.error(
      '[contact] gagal memuat lokasi:',
      error instanceof Error ? error.message : error,
    )
    return []
  }
}

function BranchAddress({ branch }: { branch: ContactBranch }) {
  const address = [branch.address, branch.city].filter(Boolean).join(', ')
  return <>{address || 'Alamat belum tersedia'}</>
}

export default async function ContactPage() {
  const branches = (await loadBranches()).sort(
    (a, b) => branchOrder(a.name) - branchOrder(b.name),
  )
  const directBranch = branches.find((branch) => branch.phone) ?? null

  return (
    <div className="min-h-screen bg-white">
      <section className="border-b border-stone-200 bg-stone-50">
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 md:pb-12 md:pt-10 lg:px-8">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-widest"
          >
            <Link href="/" className="text-forest hover:text-forest-dark">
              Beranda
            </Link>
            <span className="text-stone-300" aria-hidden="true">
              /
            </span>
            <span className="text-stone-600" aria-current="page">
              Hubungi Kami
            </span>
          </nav>

          <div className="mt-6 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-wider text-forest">Kontak</p>
            <h1 className="mt-3 font-sans text-4xl font-black uppercase leading-[0.95] tracking-tight text-stone-900 sm:text-5xl">
              Hubungi Habema
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-stone-600 md:text-base">
              Tanyakan stok, jadwal pengambilan, atau kebutuhan peralatan untuk kegiatan Anda.
              Pilih lokasi terdekat agar tim bisa menjawab sesuai ketersediaan setempat.
            </p>
          </div>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:px-8">
          <div>
            {branches.length > 0 ? (
              <ContactForm branches={branches} />
            ) : (
              <div
                role="alert"
                className="rounded-2xl border border-stone-200 bg-stone-50 p-6"
              >
                <h2 className="text-lg font-bold text-stone-900">Data lokasi belum tersedia</h2>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  Halaman ini belum bisa memuat nomor dan alamat lokasi. Muat ulang halaman
                  beberapa saat lagi, atau hubungi kami lewat Instagram.
                </p>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-forest px-5 text-sm font-bold text-white transition-colors hover:bg-forest-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/30 focus-visible:ring-offset-2"
                >
                  Buka Instagram Habema
                </a>
              </div>
            )}
          </div>

          <aside className="rounded-2xl border border-stone-200 bg-stone-50 p-5 md:p-6 lg:sticky lg:top-24">
            <h2 className="text-lg font-bold text-stone-900">Kanal langsung</h2>
            <p className="mt-1 text-sm leading-relaxed text-stone-600">
              Gunakan jalur di bawah ini jika Anda ingin bicara langsung dengan tim.
            </p>

            <ul className="mt-5 space-y-4">
              {directBranch?.phone && (
                <li>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                    WhatsApp
                  </p>
                  <a
                    href={waHref(directBranch.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex text-sm font-bold text-forest underline decoration-forest/30 underline-offset-4 hover:text-forest-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/30 focus-visible:ring-offset-2"
                  >
                    {directBranch.phone}
                  </a>
                  <p className="mt-1 text-xs text-stone-600">
                    {displayBranchName(directBranch.name)}
                  </p>
                </li>
              )}

              {directBranch?.phone && (
                <li>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                    Telepon
                  </p>
                  <a
                    href={phoneHref(directBranch.phone)}
                    className="mt-1 inline-flex text-sm font-bold text-forest underline decoration-forest/30 underline-offset-4 hover:text-forest-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/30 focus-visible:ring-offset-2"
                  >
                    {directBranch.phone}
                  </a>
                </li>
              )}

              <li>
                <p className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                  Instagram
                </p>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex text-sm font-bold text-forest underline decoration-forest/30 underline-offset-4 hover:text-forest-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/30 focus-visible:ring-offset-2"
                >
                  @habemaoutdoor
                </a>
              </li>
            </ul>

            {branches.length > 0 && (
              <a
                href="#lokasi"
                className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-5 text-xs font-bold uppercase tracking-wider text-stone-700 transition-colors hover:border-forest hover:text-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/30 focus-visible:ring-offset-2"
              >
                Lihat alamat
              </a>
            )}
          </aside>
        </div>
      </section>

      {branches.length > 0 && (
        <section id="lokasi" className="scroll-mt-24 border-t border-stone-200 bg-stone-50 py-10 md:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-forest">Alamat</p>
                <h2 className="mt-2 font-sans text-2xl font-black uppercase tracking-tight text-stone-900 md:text-3xl">
                  Lokasi Habema
                </h2>
              </div>
              <p className="text-sm text-stone-600">{branches.length} lokasi aktif</p>
            </div>

            <ul className="mt-8 divide-y divide-stone-200 border-y border-stone-200">
              {branches.map((branch) => (
                <li
                  key={branch.id}
                  className="grid gap-4 py-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] md:items-start md:gap-8"
                >
                  <div>
                    <h3 className="text-base font-bold text-stone-900">
                      {displayBranchName(branch.name)}
                    </h3>
                    <p className="mt-1 max-w-xl text-sm leading-relaxed text-stone-600">
                      <BranchAddress branch={branch} />
                    </p>
                  </div>

                  <div className="text-sm">
                    {branch.phone ? (
                      <a
                        href={phoneHref(branch.phone)}
                        className="font-bold text-forest underline decoration-forest/30 underline-offset-4 hover:text-forest-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/30 focus-visible:ring-offset-2"
                      >
                        {branch.phone}
                      </a>
                    ) : (
                      <p className="text-stone-600">Nomor telepon belum tersedia</p>
                    )}
                    {branch.operationalHours && (
                      <p className="mt-1 text-stone-600">{branch.operationalHours}</p>
                    )}
                  </div>

                  <div>
                    {branch.mapUrl ? (
                      <a
                        href={branch.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-xs font-bold uppercase tracking-wider text-stone-700 transition-colors hover:border-forest hover:text-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/30 focus-visible:ring-offset-2"
                      >
                        Buka peta
                      </a>
                    ) : (
                      <span className="text-xs text-stone-500">Peta belum tersedia</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  )
}
