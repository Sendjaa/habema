'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Minus, Plus, MapPin, Loader2, CheckCircle2 } from 'lucide-react'
import { DateRangePicker } from '@/components/booking/date-range-picker'
import { calculateDaysBetween } from '@/lib/booking-utils'
import { toast } from 'sonner'

type BundleDetail = {
  id: string
  name: string
  description: string | null
  category: string
  bundle_price: number
  original_price: number | null
  discount_percentage: number | null
  image_url: string | null
  paxMin: number | null
  paxMax: number | null
  paxLabel: string | null
  pricePerNight: number
  unit: string
  include: string[]
  exclude: string[]
  items: { equipment_id: string; name: string; quantity: number; price_per_night: number; image_url: string | null }[]
  hasStockLink: boolean
}

const formatRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

export default function PackageDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = Array.isArray((params as any)?.id) ? (params as any).id[0] : (params as any)?.id

  const [bundle, setBundle] = useState<BundleDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [qty, setQty] = useState(1)
  const [branches, setBranches] = useState<any[]>([])
  const [loadingBranches, setLoadingBranches] = useState(false)
  const [pickupBranchId, setPickupBranchId] = useState<string | null>(null)
  const [branchPhone, setBranchPhone] = useState('6283898749357')

  useEffect(() => {
    const load = async () => {
      if (!id) return
      try {
        setLoading(true)
        const res = await fetch(`/api/bundles/${id}`)
        const json = await res.json().catch(() => ({}))
        if (!res.ok || !json.success) throw new Error(json.error || 'Paket tidak ditemukan')
        setBundle(json.data)
      } catch (e: any) {
        toast.error(e?.message || 'Gagal memuat paket')
        setBundle(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  useEffect(() => {
    const fetchPhone = async () => {
      try {
        const res = await fetch('/api/branches')
        const json = await res.json().catch(() => ({}))
        const phone = json?.data?.[0]?.phone
        if (phone) {
          const cleaned = String(phone).replace(/[^0-9]/g, '')
          setBranchPhone(cleaned.startsWith('0') ? '62' + cleaned.slice(1) : cleaned.startsWith('62') ? cleaned : '62' + cleaned)
        }
      } catch {}
    }
    fetchPhone()
  }, [])

  // Muat ketersediaan cabang untuk paket ini (mempertimbangkan tanggal bila ada).
  useEffect(() => {
    const loadBranches = async () => {
      if (!bundle) return
      try {
        setLoadingBranches(true)
        const sp = new URLSearchParams({ bundleId: bundle.id, bundleQty: String(qty) })
        if (startDate && endDate) {
          sp.set('startDate', startDate.toISOString())
          sp.set('endDate', endDate.toISOString())
        }
        const res = await fetch(`/api/branches/availability?${sp.toString()}`)
        const json = await res.json().catch(() => ({}))
        if (res.ok && json.success) {
          const list = (json.data || []).filter((b: any) => (b.packageStock ?? b.stock ?? 0) > 0 || b.hasStockLink === false)
          setBranches(json.data || [])
          setPickupBranchId((prev) => prev || (json.data || [])[0]?.id || null)
          if (list.length === 0 && (json.data || []).length > 0) {
            // semua cabang habis untuk qty ini — tetap tampilkan agar user bisa turunkan qty
          }
        }
      } catch {
        setBranches([])
      } finally {
        setLoadingBranches(false)
      }
    }
    loadBranches()
  }, [bundle, startDate, endDate, qty])

  const days = useMemo(
    () => (startDate && endDate ? Math.max(1, calculateDaysBetween(startDate, endDate)) : 0),
    [startDate, endDate],
  )
  const total = useMemo(
    () => (bundle ? Number(bundle.pricePerNight || 0) * (days || 0) * qty : 0),
    [bundle, days, qty],
  )
  const pickupBranch = branches.find((b: any) => b.id === pickupBranchId) || null

  const handleBooking = () => {
    if (!bundle) return
    if (!startDate || !endDate) {
      toast.error('Pilih tanggal sewa dulu')
      return
    }
    if (!pickupBranchId) {
      toast.error('Pilih cabang pengambilan dulu')
      return
    }
    const sp = new URLSearchParams({
      type: 'bundle',
      id: bundle.id,
      quantity: String(qty),
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10),
    })
    router.push(`/booking?${sp.toString()}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-stone-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Memuat paket...
      </div>
    )
  }

  if (!bundle) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-4">
        <p className="text-lg font-bold text-stone-800">Paket tidak ditemukan</p>
        <Link href="/packages" className="text-sm text-emerald-700 font-semibold">← Kembali ke daftar paket</Link>
      </div>
    )
  }

  const waText = encodeURIComponent(`Halo Habema Outdoor, saya tertarik dengan ${bundle.name} (${bundle.paxLabel || 'paket grup'})`)
  const perPerson = bundle.paxMax ? Math.round(Number(bundle.pricePerNight) / bundle.paxMax) : null

  return (
    <div className="min-h-screen bg-[#faf9f7] pb-20">
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-24">
        <Link href="/packages" className="inline-flex items-center gap-2 text-sm font-semibold text-stone-500 hover:text-stone-800 mb-5">
          <ArrowLeft className="w-4 h-4" /> Semua paket
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Kiri: galeri + deskripsi */}
          <div className="lg:col-span-2 space-y-5">
            <div className="relative h-72 md:h-96 rounded-[28px] overflow-hidden bg-stone-200">
              <Image
                src={bundle.image_url || 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200&q=80'}
                alt={bundle.name}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
              <span className="absolute top-4 left-4 text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-white/90 text-teal-800">
                {bundle.category}
              </span>
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                <div>
                  <h1 className="text-white text-2xl md:text-4xl font-black leading-tight drop-shadow">{bundle.name}</h1>
                  {bundle.paxLabel && <p className="text-white/85 text-sm font-semibold mt-1">👥 {bundle.paxLabel} · harga per paket per malam</p>}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[24px] border border-stone-100 p-6">
              <div className="flex flex-wrap items-end gap-3 mb-3">
                <p className="text-3xl font-black text-stone-900">{formatRp(Number(bundle.pricePerNight))}<span className="text-sm font-medium text-stone-400 ml-1">/paket/malam</span></p>
                {bundle.original_price ? (
                  <p className="text-stone-400 line-through text-sm mb-1">{formatRp(Number(bundle.original_price))}</p>
                ) : null}
                {perPerson ? (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 mb-1.5">
                    ≈ {formatRp(perPerson)}/orang/malam
                  </span>
                ) : null}
              </div>
              {bundle.description && <p className="text-stone-600 text-sm leading-relaxed">{bundle.description}</p>}

              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-teal-700 mb-2">Include</p>
                  <ul className="space-y-1.5">
                    {bundle.include.map((it) => (
                      <li key={it} className="flex gap-2 text-sm text-stone-600"><span className="text-teal-600 text-xs mt-0.5">✦</span>{it}</li>
                    ))}
                  </ul>
                </div>
                {bundle.exclude.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">Exclude</p>
                    <ul className="space-y-1.5">
                      {bundle.exclude.map((it) => (
                        <li key={it} className="flex gap-2 text-sm text-stone-400"><span className="text-xs mt-0.5">✕</span>{it}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {bundle.items.length > 0 && (
                <div className="mt-6 rounded-2xl bg-stone-50 border border-stone-100 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-stone-500 mb-2">Rincian alat (untuk cek stok)</p>
                  <ul className="space-y-1.5">
                    {bundle.items.map((it) => (
                      <li key={it.equipment_id} className="flex items-center justify-between text-sm">
                        <span className="text-stone-700 font-medium">{it.name}</span>
                        <span className="text-stone-500 font-bold">×{it.quantity * qty} <span className="font-normal text-xs">per booking</span></span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-stone-400 mt-2 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Stok dicek otomatis per cabang saat booking.</p>
                </div>
              )}
            </div>
          </div>

          {/* Kanan: form booking */}
          <div className="bg-white rounded-[24px] border border-stone-100 p-6 space-y-5 lg:sticky lg:top-24">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">Tanggal sewa</p>
              <DateRangePicker
                onDateRangeSelect={(s: Date, e: Date) => { setStartDate(s); setEndDate(e) }}
                selectedStartDate={startDate || undefined}
                selectedEndDate={endDate || undefined}
              />
              {days > 0 && <p className="text-xs text-stone-500 font-semibold mt-2">Durasi: {days} hari</p>}
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">Jumlah paket</p>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-10 h-10 rounded-xl border border-stone-200 flex items-center justify-center hover:bg-stone-50" aria-label="Kurangi">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-xl font-black w-10 text-center">{qty}</span>
                <button type="button" onClick={() => setQty((q) => Math.min(10, q + 1))} className="w-10 h-10 rounded-xl border border-stone-200 flex items-center justify-center hover:bg-stone-50" aria-label="Tambah">
                  <Plus className="w-4 h-4" />
                </button>
                <span className="text-xs text-stone-400">Maks. 10 paket/booking</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">Cabang pengambilan</p>
              {loadingBranches ? (
                <p className="text-xs text-stone-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Mengecek stok paket...</p>
              ) : branches.length === 0 ? (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">Stok paket tidak tersedia. Coba tanggal/qty lain.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {branches.map((b: any) => {
                    const packs = b.packageStock ?? b.stock ?? 0
                    const selected = pickupBranchId === b.id
                    const disabled = b.hasStockLink !== false && packs < 1
                    return (
                      <button
                        key={b.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => setPickupBranchId(b.id)}
                        className={`w-full p-3 rounded-xl border-2 text-left transition-all ${selected ? 'border-teal-600 bg-teal-50/60' : 'border-stone-200 bg-white hover:border-stone-300'} ${disabled ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 mt-0.5 text-teal-700" />
                            <div>
                              <p className="text-sm font-bold text-stone-800">{b.name}</p>
                              <p className="text-[11px] text-stone-500">{b.address}{b.city ? `, ${b.city}` : ''}</p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${disabled ? 'bg-stone-100 text-stone-500' : 'bg-emerald-100 text-emerald-700'}`}>
                            {b.hasStockLink === false ? 'Bisa dipesan' : disabled ? 'Habis' : `Bisa ${packs} paket`}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-stone-900 text-white p-4">
              <div className="flex justify-between text-xs text-white/70 mb-1">
                <span>{formatRp(Number(bundle.pricePerNight))} × {days || 0} hari × {qty} paket</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold uppercase tracking-widest text-white/60">Total</span>
                <span className="text-2xl font-black">{days > 0 ? formatRp(total) : '—'}</span>
              </div>
              {pickupBranch && <p className="text-[11px] text-white/60 mt-1">Ambil di: {pickupBranch.name}</p>}
            </div>

            <button
              type="button"
              onClick={handleBooking}
              disabled={!startDate || !endDate || !pickupBranchId}
              className="w-full py-4 rounded-2xl font-bold text-sm bg-teal-700 hover:bg-teal-800 text-white transition-all disabled:opacity-50 shadow-lg"
            >
              Booking Sekarang
            </button>
            <a
              href={`https://wa.me/${branchPhone}?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center py-3 rounded-2xl font-bold text-sm border border-stone-200 text-stone-700 hover:bg-stone-50"
            >
              Tanya via WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
