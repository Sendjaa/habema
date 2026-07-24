'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, Percent, Plus, Edit, X, AlertTriangle, Package } from 'lucide-react'
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

const formatDate = (d: string | null) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const formatCurrency = (n: number | null) => {
  if (n == null) return '—'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
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
    const nowPromo = item.is_promo
    const newPromo = !nowPromo
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Promo Produk</h1>
          <p className="text-sm text-stone-500 mt-1">Kelola diskon & promo untuk produk perlengkapan</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input
            placeholder="Cari produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 bg-stone-100 rounded-lg p-1">
          {(['all', 'active', 'upcoming', 'expired'] as const).map((tab) => {
            const labels = { all: 'Semua', active: 'Aktif', upcoming: 'Akan Datang', expired: 'Berakhir' }
            const counts = { all: null, active: activeCount, upcoming: upcomingCount, expired: expiredCount }
            return (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  filterTab === tab
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                {labels[tab]}
                {counts[tab] != null && (
                  <span className="ml-1.5 text-[10px] opacity-60">({counts[tab]})</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <Card className="overflow-hidden border border-stone-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="text-left py-3 px-4 font-semibold text-stone-600">Produk</th>
                <th className="text-left py-3 px-4 font-semibold text-stone-600">Kategori</th>
                <th className="text-right py-3 px-4 font-semibold text-stone-600">Harga Normal</th>
                <th className="text-center py-3 px-4 font-semibold text-stone-600">Promo</th>
                <th className="text-center py-3 px-4 font-semibold text-stone-600">Diskon</th>
                <th className="text-center py-3 px-4 font-semibold text-stone-600">Periode</th>
                <th className="text-right py-3 px-4 font-semibold text-stone-600">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-stone-400">
                    <span className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin inline-block" />
                    <p className="mt-2">Memuat data...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-stone-400">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="font-medium text-stone-500">Tidak ada produk ditemukan</p>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const nowD = new Date()
                  const isPromoActive = item.is_promo &&
                    item.promo_start_date && new Date(item.promo_start_date) <= nowD &&
                    item.promo_end_date && new Date(item.promo_end_date) >= nowD

                  const isPromoExpired = item.is_promo &&
                    item.promo_end_date && new Date(item.promo_end_date) < nowD

                  const isPromoUpcoming = item.is_promo &&
                    item.promo_start_date && new Date(item.promo_start_date) > nowD

                  return (
                    <tr key={item.id} className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-stone-100 flex-shrink-0 overflow-hidden">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-400">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-stone-900">{item.name}</p>
                            {item.brand && (
                              <p className="text-[11px] text-stone-400">{item.brand}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-stone-500">
                        {item.equipment_categories?.name || '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-stone-700">
                        {formatCurrency(item.price_per_night)}
                        <span className="text-[10px] text-stone-400 ml-1">/malam</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isPromoActive ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200">Aktif</Badge>
                        ) : isPromoUpcoming ? (
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200">Akan Datang</Badge>
                        ) : isPromoExpired ? (
                          <Badge className="bg-stone-100 text-stone-500 border-stone-200">Berakhir</Badge>
                        ) : (
                          <span className="text-stone-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.is_promo && item.discount_percentage ? (
                          <span className="font-bold text-red-600">{item.discount_percentage}%</span>
                        ) : (
                          <span className="text-stone-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center text-xs text-stone-500">
                        {item.is_promo ? (
                          <>
                            {formatDate(item.promo_start_date)}<br />
                            <span className="text-[10px] text-stone-400">s.d.</span><br />
                            {formatDate(item.promo_end_date)}
                          </>
                        ) : (
                          <span className="text-stone-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(item)}
                            className="text-stone-500 hover:text-emerald-600"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => togglePromo(item)}
                            className={item.is_promo ? 'text-red-500 hover:text-red-700' : 'text-stone-400 hover:text-emerald-600'}
                          >
                            <Percent className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL */}
      {showModal && editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-stone-100">
              <h2 className="text-lg font-bold text-stone-900">
                {form.is_promo ? 'Edit Promo' : 'Aktifkan Promo'} — {editItem.name}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-stone-700">Harga Normal</p>
                  <p className="text-lg font-black text-stone-900">{formatCurrency(editItem.price_per_night)}<span className="text-xs font-normal text-stone-500"> /malam</span></p>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Diskon (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
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
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Harga Promo (/malam)</Label>
                      <Input
                        type="number"
                        min="0"
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
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Mulai</Label>
                      <Input
                        type="datetime-local"
                        value={form.promo_start_date}
                        onChange={(e) => setForm({ ...form, promo_start_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Berakhir</Label>
                      <Input
                        type="datetime-local"
                        value={form.promo_end_date}
                        onChange={(e) => setForm({ ...form, promo_end_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl text-sm text-amber-800">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p>Harga promo akan ditampilkan di halaman Promo. Pastikan periode promo sudah benar.</p>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-stone-100">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Batal
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {saving ? 'Menyimpan...' : form.is_promo ? 'Simpan Promo' : 'Nonaktifkan Promo'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}