'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, Percent, Edit, X, AlertTriangle, Package, Tag } from 'lucide-react'
import { toast } from 'sonner'

interface Equipment {
  id: string
  name: string
  description: string | null
  image_url: string | null
  category_id: string
  price_per_night: number
  price_per_day: number
  stock_quantity: number
  is_active: boolean | null
  is_promo: boolean | null
  discount_percentage: number | null
  promo_price_per_night: number | null
  promo_start_date: string | null
  promo_end_date: string | null
  equipment_categories: { name: string } | null
  brand: string | null
}

interface PromoForm {
  is_promo: boolean
  discount_percentage: string
  promo_price_per_night: string
  promo_start_date: string
  promo_end_date: string
}

const EMPTY_FORM: PromoForm = {
  is_promo: false,
  discount_percentage: '',
  promo_price_per_night: '',
  promo_start_date: '',
  promo_end_date: '',
}

const FORMAT_DATE = (d: string | null) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const FORMAT_CURRENCY = (n: number | null) => {
  if (n == null) return '—'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

const STATUS_TABS = [
  { key: 'all', label: 'Semua' },
  { key: 'active', label: 'Aktif' },
  { key: 'upcoming', label: 'Akan Datang' },
  { key: 'expired', label: 'Berakhir' },
] as const

function PromoRow({
  item, now, onEdit, onToggle,
}: {
  item: Equipment
  now: Date
  onEdit: () => void
  onToggle: () => void
}) {
  const isPromoActive = item.is_promo &&
    item.promo_start_date && new Date(item.promo_start_date) <= now &&
    item.promo_end_date && new Date(item.promo_end_date) >= now

  const isPromoExpired = item.is_promo &&
    item.promo_end_date && new Date(item.promo_end_date) < now

  const isPromoUpcoming = item.is_promo &&
    item.promo_start_date && new Date(item.promo_start_date) > now

  return (
    <tr className="border-b border-stone-100 hover:bg-stone-50/60 transition-colors">
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-stone-100 flex-shrink-0 overflow-hidden">
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-stone-400">
                <Package className="w-4 h-4" />
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-stone-900">{item.name}</p>
            {item.brand && <p className="text-[10px] text-stone-400">{item.brand}</p>}
          </div>
        </div>
      </td>
      <td className="py-3.5 px-4">
        <span className="text-[11px] bg-stone-50 text-stone-600 border border-stone-200 px-2 py-0.5 rounded-full font-medium">
          {item.equipment_categories?.name || '—'}
        </span>
      </td>
      <td className="py-3.5 px-4 text-right">
        <span className="text-sm font-semibold text-stone-800">{FORMAT_CURRENCY(item.price_per_night)}</span>
        <span className="text-[10px] text-stone-400 ml-1">/malam</span>
      </td>
      <td className="py-3.5 px-4">
        {isPromoActive ? (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-medium shadow-none">Aktif</Badge>
        ) : isPromoUpcoming ? (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-medium shadow-none">Akan Datang</Badge>
        ) : isPromoExpired ? (
          <Badge className="bg-red-50 text-red-600 border-red-200 text-[10px] font-medium shadow-none">Berakhir</Badge>
        ) : (
          <span className="text-[11px] text-stone-400">—</span>
        )}
      </td>
      <td className="py-3.5 px-4 text-center">
        {item.is_promo && item.discount_percentage ? (
          <span className="text-sm font-black text-red-600">{item.discount_percentage}%</span>
        ) : (
          <span className="text-[11px] text-stone-400">—</span>
        )}
      </td>
      <td className="py-3.5 px-4 text-[11px] text-stone-500 whitespace-nowrap">
        {item.is_promo ? (
          <span title={`${FORMAT_DATE(item.promo_start_date)} — ${FORMAT_DATE(item.promo_end_date)}`}>
            {FORMAT_DATE(item.promo_start_date)}
            <span className="text-[10px] text-stone-400"> — </span>
            {FORMAT_DATE(item.promo_end_date)}
          </span>
        ) : (
          <span className="text-stone-400">—</span>
        )}
      </td>
      <td className="py-3.5 px-4 text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost" size="sm" onClick={onEdit}
            className="h-8 w-8 rounded-lg text-stone-400 hover:text-emerald-700 hover:bg-emerald-50 shadow-none p-0"
          >
            <Edit className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost" size="sm" onClick={onToggle}
            className={`h-8 w-8 rounded-lg shadow-none p-0 ${
              item.is_promo
                ? 'text-red-400 hover:text-red-600 hover:bg-red-50'
                : 'text-stone-400 hover:text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  )
}

function PromoCard({
  item, now, onEdit, onToggle,
}: {
  item: Equipment
  now: Date
  onEdit: () => void
  onToggle: () => void
}) {
  const isPromoActive = item.is_promo &&
    item.promo_start_date && new Date(item.promo_start_date) <= now &&
    item.promo_end_date && new Date(item.promo_end_date) >= now

  const isPromoExpired = item.is_promo &&
    item.promo_end_date && new Date(item.promo_end_date) < now

  const isPromoUpcoming = item.is_promo &&
    item.promo_start_date && new Date(item.promo_start_date) > now

  const statusBadge = isPromoActive
    ? { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Aktif' }
    : isPromoUpcoming
    ? { cls: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Akan Datang' }
    : isPromoExpired
    ? { cls: 'bg-red-50 text-red-600 border-red-200', label: 'Berakhir' }
    : null

  return (
    <Card className="bg-white border border-stone-200 rounded-xl shadow-none p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-stone-100 flex-shrink-0 overflow-hidden">
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-stone-400">
                <Package className="w-4 h-4" />
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-stone-900">{item.name}</p>
            {item.brand && <p className="text-[10px] text-stone-400">{item.brand}</p>}
          </div>
        </div>
        {statusBadge ? (
          <Badge className={`${statusBadge.cls} text-[10px] font-medium shadow-none shrink-0`}>{statusBadge.label}</Badge>
        ) : (
          <span className="text-[10px] text-stone-400 bg-stone-50 px-2 py-0.5 rounded-full shrink-0">Nonpromo</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-stone-500 mb-3">
        <div>
          <span className="text-stone-400">Harga:</span>{' '}
          <span className="font-semibold text-stone-700">{FORMAT_CURRENCY(item.price_per_night)}<span className="text-[10px] font-normal text-stone-400">/malam</span></span>
        </div>
        <div>
          <span className="text-stone-400">Diskon:</span>{' '}
          {item.discount_percentage ? (
            <span className="font-bold text-red-600">{item.discount_percentage}%</span>
          ) : (
            <span className="text-stone-400">—</span>
          )}
        </div>
        <div>
          <span className="text-stone-400">Kategori:</span>{' '}
          <span className="font-medium">{item.equipment_categories?.name || '—'}</span>
        </div>
        <div>
          <span className="text-stone-400">Periode:</span>{' '}
          <span>{FORMAT_DATE(item.promo_start_date)}</span>
        </div>
      </div>
      <div className="flex gap-2 pt-3 border-t border-stone-100">
        <Button
          variant="outline" size="sm" onClick={onEdit}
          className="flex-1 h-8 rounded-lg border-stone-200 text-stone-600 text-xs shadow-none gap-1 hover:border-stone-300"
        >
          <Edit className="w-3 h-3" /> Edit Promo
        </Button>
        <Button
          variant="ghost" size="sm" onClick={onToggle}
          className={`h-8 w-8 rounded-lg shadow-none p-0 ${
            item.is_promo
              ? 'text-red-400 hover:text-red-600 hover:bg-red-50'
              : 'text-stone-400 hover:text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          <Percent className="w-3.5 h-3.5" />
        </Button>
      </div>
    </Card>
  )
}

export default function ProductsPromoAdmin() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'upcoming' | 'expired'>('all')
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Equipment | null>(null)
  const [form, setForm] = useState<PromoForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select(`*, equipment_categories (name)`)
        .order('name', { ascending: true })

      if (error) throw error
      setEquipment(data || [])
    } catch (err) {
      console.error('Failed to fetch equipment:', err)
      toast.error('Gagal memuat data produk')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const now = new Date()

  const filtered = equipment.filter((item) => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase())
    if (!matchSearch) return false

    const promoActive = item.is_promo &&
      item.promo_start_date && new Date(item.promo_start_date) <= now &&
      item.promo_end_date && new Date(item.promo_end_date) >= now

    const promoUpcoming = item.is_promo &&
      item.promo_start_date && new Date(item.promo_start_date) > now

    const promoExpired = item.is_promo &&
      item.promo_end_date && new Date(item.promo_end_date) < now

    if (filterTab === 'active') return promoActive
    if (filterTab === 'upcoming') return promoUpcoming
    if (filterTab === 'expired') return promoExpired
    return true
  })

  const activeCount = equipment.filter((item) =>
    item.is_promo && item.promo_start_date && new Date(item.promo_start_date) <= now &&
    item.promo_end_date && new Date(item.promo_end_date) >= now
  ).length

  const upcomingCount = equipment.filter((item) =>
    item.is_promo && item.promo_start_date && new Date(item.promo_start_date) > now
  ).length

  const expiredCount = equipment.filter((item) =>
    item.is_promo && item.promo_end_date && new Date(item.promo_end_date) < now
  ).length

  const openEdit = (item: Equipment) => {
    setEditItem(item)
    setForm({
      is_promo: item.is_promo || false,
      discount_percentage: item.discount_percentage != null ? String(item.discount_percentage) : '',
      promo_price_per_night: item.promo_price_per_night != null ? String(item.promo_price_per_night) : '',
      promo_start_date: item.promo_start_date ? item.promo_start_date.slice(0, 16) : '',
      promo_end_date: item.promo_end_date ? item.promo_end_date.slice(0, 16) : '',
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!editItem) return
    setSaving(true)
    try {
      const discountPct = form.discount_percentage ? parseFloat(form.discount_percentage) : null
      let promoPrice: number | null = form.promo_price_per_night ? parseFloat(form.promo_price_per_night) : null

      if (form.is_promo && discountPct && promoPrice == null) {
        promoPrice = Math.round(editItem.price_per_night * (1 - discountPct / 100))
      }

      const updates: any = {
        is_promo: form.is_promo,
        discount_percentage: discountPct,
        promo_price_per_night: promoPrice,
        promo_start_date: form.promo_start_date ? new Date(form.promo_start_date).toISOString() : null,
        promo_end_date: form.promo_end_date ? new Date(form.promo_end_date).toISOString() : null,
      }

      if (!form.is_promo) {
        updates.discount_percentage = null
        updates.promo_price_per_night = null
        updates.promo_start_date = null
        updates.promo_end_date = null
      }

      const { error } = await supabase
        .from('equipment')
        .update(updates)
        .eq('id', editItem.id)

      if (error) throw error

      toast.success(form.is_promo ? 'Promo berhasil diaktifkan' : 'Promo berhasil dinonaktifkan')
      setShowModal(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan promo')
    } finally {
      setSaving(false)
    }
  }

  const togglePromo = async (item: Equipment) => {
    const newPromo = !item.is_promo
    try {
      const updates: any = { is_promo: newPromo }
      if (!newPromo) {
        updates.discount_percentage = null
        updates.promo_price_per_night = null
        updates.promo_start_date = null
        updates.promo_end_date = null
      }

      const { error } = await supabase
        .from('equipment')
        .update(updates)
        .eq('id', item.id)

      if (error) throw error
      toast.success(newPromo ? 'Promo diaktifkan' : 'Promo dinonaktifkan')
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status promo')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1EFE8] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F1EFE8] font-body">
      <div className="px-4 sm:px-6 py-6 space-y-5 max-w-[1400px] mx-auto mt-4">
        {/* ── Search & filter bar ── */}
        <Card className="px-4 py-3 bg-white border-stone-200 rounded-xl shadow-none">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
              <Input
                placeholder="Cari produk..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm border-stone-200 bg-stone-50 rounded-lg focus:border-emerald-500 focus:bg-white"
              />
            </div>

            <div className="flex gap-1 bg-stone-100 rounded-lg p-0.5">
              {STATUS_TABS.map(({ key, label }) => {
                const counts = { all: null, active: activeCount, upcoming: upcomingCount, expired: expiredCount } as const
                return (
                  <button
                    key={key}
                    onClick={() => setFilterTab(key)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                      filterTab === key
                        ? 'bg-white text-stone-900 shadow-sm'
                        : 'text-stone-500 hover:text-stone-700'
                    }`}
                  >
                    {label}
                    {counts[key] != null && (
                      <span className="ml-1 text-[10px] opacity-60">({counts[key]})</span>
                    )}
                  </button>
                )
              })}
            </div>

            <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-md font-medium whitespace-nowrap">
              {filtered.length} produk
            </span>
          </div>
        </Card>

        {/* ── Desktop Table ── */}
        {filtered.length > 0 ? (
          <>
            <div className="hidden lg:block bg-white border border-stone-200 rounded-xl overflow-hidden shadow-none">
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200">
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">Produk</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">Kategori</th>
                    <th className="text-right py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">Harga Normal</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">Promo</th>
                    <th className="text-center py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">Diskon</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">Periode</th>
                    <th className="text-right py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <PromoRow
                      key={item.id}
                      item={item}
                      now={now}
                      onEdit={() => openEdit(item)}
                      onToggle={() => togglePromo(item)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Mobile Cards ── */}
            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered.map((item) => (
                <PromoCard
                  key={item.id}
                  item={item}
                  now={now}
                  onEdit={() => openEdit(item)}
                  onToggle={() => togglePromo(item)}
                />
              ))}
            </div>
          </>
        ) : (
          /* ── Empty state ── */
          <Card className="bg-white border-stone-200 rounded-xl shadow-none py-16 text-center">
            <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Tag className="w-7 h-7 text-stone-300" />
            </div>
            <h3 className="text-stone-800 font-medium mb-2" style={{ fontFamily: "'Fraunces', serif", fontSize: '16px' }}>
              {search || filterTab !== 'all' ? 'Produk tidak ditemukan' : 'Belum ada produk promo'}
            </h3>
            <p className="text-sm text-stone-400 mb-6 max-w-xs mx-auto">
              {search || filterTab !== 'all'
                ? 'Coba ubah kata kunci atau filter status.'
                : 'Atur promo produk dari halaman daftar produk.'}
            </p>
            {(search || filterTab !== 'all') && (
              <Button
                variant="outline" size="sm"
                onClick={() => { setSearch(''); setFilterTab('all') }}
                className="h-9 px-5 rounded-lg border-stone-200 text-stone-600 text-sm shadow-none"
              >
                Reset Filter
              </Button>
            )}
          </Card>
        )}
      </div>

      {/* ── Modal ── */}
      {showModal && editItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <Card className="w-full max-w-lg bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Percent className="w-4 h-4 text-emerald-700" />
                </div>
                <h2 className="text-sm font-medium text-stone-900" style={{ fontFamily: "'Fraunces', serif" }}>
                  {form.is_promo ? 'Edit Promo' : 'Aktifkan Promo'}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-lg border border-stone-200 flex items-center justify-center text-stone-400 hover:bg-stone-50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                <div>
                  <p className="text-xs text-stone-500">{editItem.name}</p>
                  <p className="text-lg font-black text-stone-900">{FORMAT_CURRENCY(editItem.price_per_night)}<span className="text-xs font-normal text-stone-500"> /malam</span></p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_promo}
                    onChange={(e) => setForm({ ...form, is_promo: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
                  <span className="ml-3 text-sm font-bold text-stone-700">{form.is_promo ? 'Aktif' : 'Nonaktif'}</span>
                </label>
              </div>

              {form.is_promo && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-stone-400 font-medium uppercase tracking-widest">Diskon (%)</Label>
                      <Input
                        type="number" min="0" max="100" step="0.01"
                        placeholder="20"
                        value={form.discount_percentage}
                        onChange={(e) => {
                          const val = e.target.value
                          setForm({ ...form, discount_percentage: val })
                          if (val && !form.promo_price_per_night) {
                            const pct = parseFloat(val)
                            if (!isNaN(pct)) {
                              setForm(f => ({
                                ...f,
                                discount_percentage: val,
                                promo_price_per_night: String(Math.round(editItem.price_per_night * (1 - pct / 100)))
                              }))
                            }
                          }
                        }}
                        className="h-10 text-sm rounded-lg border-stone-200 bg-stone-50 focus:border-emerald-500 focus:bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-stone-400 font-medium uppercase tracking-widest">Harga Promo (/malam)</Label>
                      <Input
                        type="number" min="0"
                        placeholder="Harga promo"
                        value={form.promo_price_per_night}
                        onChange={(e) => {
                          const val = e.target.value
                          setForm({ ...form, promo_price_per_night: val })
                          if (val && !form.discount_percentage) {
                            const promo = parseFloat(val)
                            if (!isNaN(promo) && editItem.price_per_night > 0) {
                              const pct = Math.round((1 - promo / editItem.price_per_night) * 100)
                              setForm(f => ({
                                ...f,
                                promo_price_per_night: val,
                                discount_percentage: String(pct > 0 ? pct : '')
                              }))
                            }
                          }
                        }}
                        className="h-10 text-sm rounded-lg border-stone-200 bg-stone-50 focus:border-emerald-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-stone-400 font-medium uppercase tracking-widest">Mulai</Label>
                      <Input
                        type="datetime-local"
                        value={form.promo_start_date}
                        onChange={(e) => setForm({ ...form, promo_start_date: e.target.value })}
                        className="h-10 text-sm rounded-lg border-stone-200 bg-stone-50 focus:border-emerald-500 focus:bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-stone-400 font-medium uppercase tracking-widest">Berakhir</Label>
                      <Input
                        type="datetime-local"
                        value={form.promo_end_date}
                        onChange={(e) => setForm({ ...form, promo_end_date: e.target.value })}
                        className="h-10 text-sm rounded-lg border-stone-200 bg-stone-50 focus:border-emerald-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl text-xs text-amber-800">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p>Harga promo akan ditampilkan di halaman Promo. Pastikan periode promo sudah benar.</p>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2.5 px-5 py-4 border-t border-stone-100">
              <Button
                type="button" variant="outline"
                onClick={() => setShowModal(false)}
                className="flex-1 h-10 rounded-xl border-stone-200 text-stone-600 text-sm shadow-none"
              >
                Batal
              </Button>
              <Button
                onClick={handleSave} disabled={saving}
                className="flex-[2] h-10 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm shadow-none"
              >
                {saving ? 'Menyimpan...' : form.is_promo ? 'Simpan Promo' : 'Nonaktifkan Promo'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
