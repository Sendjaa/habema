import { Metadata } from 'next'
import Image from 'next/image'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

export const metadata: Metadata = {
  title: 'Tentang Habema | Rental Alat Outdoor, Beli Gear, & Open Trip',
  description: 'Sewa alat outdoor, beli perlengkapan, dan ikuti open trip di Bandung Raya.',
}

interface Branch {
  id: string
  name: string
  address: string | null
  city: string | null
  phone: string | null
  operationalHours: string | null
  mapUrl: string | null
}

async function loadBranches(): Promise<Branch[]> {
  try {
    const supa = await createServerSupabaseClient()
    const { data, error } = await supa
      .from('branches')
      .select('id, name, address, city, phone, operational_hours, map_url')
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) throw error

    return (data ?? []).map((b) => ({
      id: b.id,
      name: b.name,
      address: b.address,
      city: b.city,
      phone: b.phone,
      operationalHours: b.operational_hours,
      mapUrl: b.map_url,
    }))
  } catch (e) {
    console.error('[about] gagal memuat cabang', e)
    return []
  }
}

async function loadEquipmentCount(): Promise<number> {
  try {
    const supa = await createServerSupabaseClient()
    const { count, error } = await supa
      .from('equipment')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (error) throw error
    return count ?? 0
  } catch (e) {
    console.error('[about] gagal memuat peralatan', e)
    return 0
  }
}

function displayBranchName(name: string): string {
  return name.replace(/\s*\(cabang\s*\d+\)\s*$/i, '').trim()
}

export default async function AboutPage() {
  const branches = await loadBranches()
  const equipmentCount = await loadEquipmentCount()
  const activeBranchCount = branches.length

  return (
    <div className="min-h-screen bg-cream">
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="text-left md:text-left">
              <p className="text-xs font-bold uppercase tracking-wider text-forest mb-3">
                Tentang Habema
              </p>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-black uppercase leading-[0.95] tracking-tight text-stone-900">
                Tentang Habema
              </h1>
              <p className="mt-5 max-w-xl text-sm md:text-base leading-relaxed text-stone-600">
                Sewa peralatan outdoor, beli perlengkapan, dan ikuti open trip.
                Kami hadir untuk petualangan di Bandung Raya dan sekitarnya.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <a
                  href="/catalog_rental"
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-forest px-6 text-sm font-bold text-white transition-colors hover:bg-forest-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/30 focus-visible:ring-offset-2"
                >
                  Sewa Alat Sekarang
                </a>
                <a
                  href="/contact"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-6 text-sm font-bold uppercase tracking-wider text-stone-700 transition-colors hover:border-forest hover:text-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/30 focus-visible:ring-offset-2"
                >
                  Hubungi Kami
                </a>
              </div>
            </div>

            <div className="relative w-full h-64 md:h-[420px] overflow-hidden bg-white">
              <Image
                src="/images/id-11134216-7rbk5-m70jpai21w0xda.jpg"
                alt="Ilustrasi perjalanan outdoor Habema"
                fill
                priority
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-cream-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-3xl md:text-4xl font-black uppercase tracking-tight text-stone-900">
              Cerita Kami
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Habema lahir dari kebutuhan akan perlengkapan outdoor yang siap pakai dan mudah diakses di Bandung Raya.
              Kami memahami bahwa petualangan berlanjut dengan lancar ketika alat yang digunakan berkualitas, terawat,
              dan tersedia tepat waktu.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-start">
          <div>
            <h3 className="font-display text-3xl font-black uppercase tracking-tight text-stone-900 mb-4">
              Visi
            </h3>
            <p className="text-base leading-relaxed text-stone-600">
              Menjadi jembatan antara petualang dan perlengkapan outdoor berkualitas di Bandung Raya.
            </p>
          </div>
          <div>
            <h3 className="font-display text-3xl font-black uppercase tracking-tight text-stone-900 mb-4">
              Misi
            </h3>
            <p className="text-base leading-relaxed text-stone-600">
              Menyediakan akses sewa, jual, dan open trip yang transparan dan jujur untuk semua kalangan petualang.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-cream-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl md:text-4xl font-black uppercase tracking-tight text-stone-900 text-center mb-12">
            Nilai Kami
          </h2>
          <ul className="grid md:grid-cols-3 gap-8">
            <li className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <h4 className="font-bold text-stone-900 mb-2">
                Ketersediaan yang jelas
              </h4>
              <p className="text-sm leading-relaxed text-stone-600">
                Setiap alat dan perlengkapan dicatat ketersediaannya sebelum disewakan atau dijual.
              </p>
            </li>
            <li className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <h4 className="font-bold text-stone-900 mb-2">
                Kondisi siap pakai
              </h4>
              <p className="text-sm leading-relaxed text-stone-600">
                Peralatan dicek sebelum dan setelah digunakan agar tetap aman dan nyaman.
              </p>
            </li>
            <li className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <h4 className="font-bold text-stone-900 mb-2">
                Layanan pelanggan responsif
              </h4>
              <p className="text-sm leading-relaxed text-stone-600">
                Tim siap menjawab pertanyaan sewa, pembelian, dan jadwal open trip melalui WhatsApp.
              </p>
            </li>
          </ul>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl md:text-4xl font-black uppercase tracking-tight text-stone-900 text-center mb-12">
            Kami Saat Ini
          </h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="rounded-2xl border border-stone-200 bg-cream p-6 shadow-sm">
              <div className="text-4xl md:text-5xl font-bold text-forest mb-2">
                {activeBranchCount}
              </div>
              <div className="text-sm text-stone-600">Lokasi aktif</div>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-cream p-6 shadow-sm">
              <div className="text-4xl md:text-5xl font-bold text-forest mb-2">
                {equipmentCount}
              </div>
              <div className="text-sm text-stone-600">Alat outdoor aktif</div>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-cream p-6 shadow-sm">
              <div className="text-4xl md:text-5xl font-bold text-forest mb-2">
                08.00 - 20.00
              </div>
              <div className="text-sm text-stone-600">WIB, setiap hari</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-cream-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl md:text-4xl font-black uppercase tracking-tight text-stone-900 text-center mb-12">
            Tim & Pelayanan
          </h2>
          <ul className="grid md:grid-cols-3 gap-8">
            <li className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <h4 className="font-bold text-stone-900 mb-2">
                Tim Operasional
              </h4>
              <p className="text-sm leading-relaxed text-stone-600">
                Mengatur jadwal sewa, pengambilan, dan pengembalian alat.
              </p>
            </li>
            <li className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <h4 className="font-bold text-stone-900 mb-2">
                Tim Gudang
              </h4>
              <p className="text-sm leading-relaxed text-stone-600">
                Memelihara dan memeriksa kondisi peralatan sebelum diserahkan.
              </p>
            </li>
            <li className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <h4 className="font-bold text-stone-900 mb-2">
                Layanan Pelanggan
              </h4>
              <p className="text-sm leading-relaxed text-stone-600">
                Siap membantu via WhatsApp dan kontak langsung di cabang.
              </p>
            </li>
          </ul>
        </div>
      </section>

      {activeBranchCount > 0 && (
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-black uppercase tracking-tight text-stone-900">
                Lokasi Kami
              </h2>
              <p className="mt-3 text-sm text-stone-600">
                {activeBranchCount} lokasi aktif
              </p>
            </div>

            <ul className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {branches.map((b) => (
                <li
                  key={b.id}
                  className="rounded-2xl border border-stone-200 bg-cream p-6 shadow-sm"
                >
                  <h3 className="text-lg font-bold text-stone-900">
                    {displayBranchName(b.name)}
                  </h3>
                  <address className="mt-2 not-italic text-sm leading-relaxed text-stone-600">
                    {[b.address, b.city].filter(Boolean).join(', ')}
                  </address>
                  {b.phone && (
                    <p className="mt-3 text-sm">
                      <a
                        href={`tel:+${b.phone.replace(/[^0-9]/g, '')}`}
                        className="font-medium text-forest underline decoration-forest/30"
                      >
                        {b.phone}
                      </a>
                    </p>
                  )}
                  {b.operationalHours && (
                    <p className="mt-2 text-xs text-stone-500">
                      Buka {b.operationalHours}
                    </p>
                  )}
                  {b.mapUrl && (
                    <div className="mt-5">
                      <a
                        href={b.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-xs font-bold uppercase tracking-wider text-stone-700 transition-colors hover:border-forest hover:text-forest"
                      >
                        Buka Peta
                      </a>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl md:text-4xl font-black uppercase tracking-tight text-stone-900 text-center mb-12">
            Galeri
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-white shadow-sm">
              <Image
                src="/images/id-11134207-8224y-miplzdta6f48e3.jpeg"
                alt="Hydropack"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-white shadow-sm">
              <Image
                src="/images/bannerImage.jpeg"
                alt="Hydropack"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-white shadow-sm md:col-span-1">
              <Image
                src="/images/Screenshot 2026-04-23 171955.jpg"
                alt="Hydropack"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-white shadow-sm md:col-span-1">
              <Image
                src="/images/background_products.jpg"
                alt="Perlengkapan outdoor Habema"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-white shadow-sm md:col-span-2">
              <Image
                src="/images/bannerImage.webp"
                alt="Ilustrasi perjalanan outdoor Habema"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section> */}

      <section className="py-16 md:py-24 bg-forest text-white text-center">
        <div className="max-w-2xl mx-auto">
          <p className="mb-4">
            <a
              href="https://www.instagram.com/habemaoutdoor?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline decoration-forest/30 hover:text-forest-light"
            >
              Lihat cerita dan foto pelanggan di Instagram
            </a>
          </p>
          <p className="text-sm text-white/80">
            Tidak ada testimoni palsu, hanya konten nyata dari pelanggan kami.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-forest text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-black uppercase tracking-tight">
            Siap Memulai Petualangan?
          </h2>
          <p className="mt-4 text-base text-forest-light">
            Pilih sewa, beli, atau ikuti open trip, dan mulai jelajahi alam.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/catalog_rental"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-6 text-sm font-bold text-forest transition-colors hover:bg-forest-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/30 focus-visible:ring-offset-2"
            >
              Sewa Alat Sekarang
            </a>
            <a
              href="/contact"
              className="inline-flex h-11 items-center justify-center rounded-xl border-2 border-white px-6 text-sm font-bold uppercase tracking-wider text-white hover:bg-white hover:text-forest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/30 focus-visible:ring-offset-2"
            >
              Hubungi Kami
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}