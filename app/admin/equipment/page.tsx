'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Plus, Search, Edit, Trash2, Package, X, ChevronLeft, AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'

// ── Types ──────────────────────────────────────────────────────
interface Equipment {
  id: string
  name: string
  description?: string
  price_per_day: number
  stock_quantity: number
  is_available: boolean
  image_url?: string
  category?: string
  created_at: string
  updated_at: string
}

type FormData = {
  name: string
  description: string
  price_per_day: string
  stock_quantity: string
  category: string
  image_url: string
  is_available: boolean
}

const EMPTY_FORM: FormData = {
  name: '', description: '', price_per_day: '', stock_quantity: '',
  category: '', image_url: '', is_available: true,
}

const CATEGORIES = ['Tenda', 'Tidur', 'Carrier', 'Penerangan', 'Masak', 'Navigasi', 'Pakaian', 'Lainnya']

// ── Helpers ────────────────────────────────────────────────────
const formatCurrency = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

const stockInfo = (qty: number) => {
  if (qty === 0) return { cls: 'bg-red-50 text-red-800 border border-red-200',     label: 'Habis' }
  if (qty <= 3)  return { cls: 'bg-amber-50 text-amber-800 border border-amber-200', label: `${qty} unit` }
  return              { cls: 'bg-emerald-50 text-emerald-800 border border-emerald-200', label: `${qty} unit` }
}

// ── Modal ──────────────────────────────────────────────────────
function EquipmentModal({
  open, onClose, onSubmit, editingItem, loading,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (data: FormData) => Promise<void>
  editingItem: Equipment | null
  loading: boolean
}) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM)

  useEffect(() => {
    if (editingItem) {
      setForm({
        name: editingItem.name,
        description: editingItem.description ?? '',
        price_per_day: editingItem.price_per_day.toString(),
        stock_quantity: editingItem.stock_quantity.toString(),
        category: editingItem.category ?? '',
        image_url: editingItem.image_url ?? '',
        is_available: editingItem.is_available,
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [editingItem, open])

  if (!open) return null

  const set = (key: keyof FormData, val: string | boolean) =>
    setForm((f) => ({ ...f, [key]: val }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(form)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <Card className="w-full max-w-md bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Package className="w-4 h-4 text-emerald-700" />
            </div>
            <h2
              className="text-sm font-medium text-stone-900"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              {editingItem ? 'Edit Produk' : 'Tambah Produk Baru'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg border border-stone-200 flex items-center justify-center text-stone-400 hover:bg-stone-50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal body */}
        <form onSubmit={handleSubmit}>
          <div className="px-5 py-4 space-y-3.5 max-h-[60vh] overflow-y-auto">

            {/* Nama */}
            <div className="space-y-1.5">
              <Label className="text-[10px] text-stone-400 font-medium uppercase tracking-widest">
                Nama Produk <span className="text-red-400">*</span>
              </Label>
              <Input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="cth. Tenda Dome 4 Orang"
                className="h-10 text-sm rounded-lg border-stone-200 bg-stone-50 focus:border-emerald-500 focus:bg-white"
                required
              />
            </div>

            {/* Deskripsi */}
            <div className="space-y-1.5">
              <Label className="text-[10px] text-stone-400 font-medium uppercase tracking-widest">
                Deskripsi
              </Label>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Deskripsi singkat produk..."
                rows={3}
                className="w-full px-3 py-2.5 text-sm border border-stone-200 rounded-lg bg-stone-50 focus:border-emerald-500 focus:bg-white outline-none transition-colors resize-none font-body"
              />
            </div>

            {/* Kategori + Stok */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] text-stone-400 font-medium uppercase tracking-widest">
                  Kategori
                </Label>
                <select
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-stone-200 rounded-lg bg-stone-50 focus:border-emerald-500 focus:bg-white outline-none transition-colors text-stone-800"
                >
                  <option value="">Pilih kategori</option>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] text-stone-400 font-medium uppercase tracking-widest">
                  Stok <span className="text-red-400">*</span>
                </Label>
                <Input
                  type="number" min="0"
                  value={form.stock_quantity}
                  onChange={(e) => set('stock_quantity', e.target.value)}
                  placeholder="0"
                  className="h-10 text-sm rounded-lg border-stone-200 bg-stone-50 focus:border-emerald-500 focus:bg-white"
                  required
                />
              </div>
            </div>

            {/* Harga + Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] text-stone-400 font-medium uppercase tracking-widest">
                  Harga/Hari (Rp) <span className="text-red-400">*</span>
                </Label>
                <Input
                  type="number" min="0"
                  value={form.price_per_day}
                  onChange={(e) => set('price_per_day', e.target.value)}
                  placeholder="50000"
                  className="h-10 text-sm rounded-lg border-stone-200 bg-stone-50 focus:border-emerald-500 focus:bg-white"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] text-stone-400 font-medium uppercase tracking-widest">
                  Status
                </Label>
                <select
                  value={String(form.is_available)}
                  onChange={(e) => set('is_available', e.target.value === 'true')}
                  className="w-full h-10 px-3 text-sm border border-stone-200 rounded-lg bg-stone-50 focus:border-emerald-500 focus:bg-white outline-none transition-colors text-stone-800"
                >
                  <option value="true">Tersedia</option>
                  <option value="false">Tidak Tersedia</option>
                </select>
              </div>
            </div>

            {/* URL Gambar */}
            <div className="space-y-1.5">
              <Label className="text-[10px] text-stone-400 font-medium uppercase tracking-widest">
                URL Gambar
              </Label>
              <Input
                type="url"
                value={form.image_url}
                onChange={(e) => set('image_url', e.target.value)}
                placeholder="https://..."
                className="h-10 text-sm rounded-lg border-stone-200 bg-stone-50 focus:border-emerald-500 focus:bg-white"
              />
            </div>

            {/* Preview gambar */}
            {form.image_url && (
              <div className="rounded-lg overflow-hidden border border-stone-200 h-28">
                <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Modal footer */}
          <div className="flex gap-2.5 px-5 py-4 border-t border-stone-100">
            <Button
              type="button" variant="outline" onClick={onClose}
              className="flex-1 h-10 rounded-xl border-stone-200 text-stone-600 text-sm shadow-none"
            >
              Batal
            </Button>
            <Button
              type="submit" disabled={loading}
              className="flex-[2] h-10 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm shadow-none"
            >
              {loading ? 'Menyimpan...' : editingItem ? 'Simpan Perubahan' : 'Tambah Produk'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

// ── Equipment Card ─────────────────────────────────────────────
function EquipmentCard({
  item, onEdit, onDelete,
}: { item: Equipment; onEdit: () => void; onDelete: () => void }) {
  const stock = stockInfo(item.stock_quantity)

  return (
    <Card className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-none hover:border-stone-300 hover:shadow-sm transition-all duration-200 flex flex-col">
      {/* Image */}
      <div className="relative h-40 bg-stone-100 flex items-center justify-center overflow-hidden flex-shrink-0">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <Package className="w-10 h-10 text-stone-300" />
        )}
        {item.category && (
          <span className="absolute top-2.5 left-2.5 text-[10px] bg-white/90 backdrop-blur-sm text-stone-700 px-2 py-0.5 rounded-full font-medium border border-stone-200">
            {item.category}
          </span>
        )}
        {!item.is_available && (
          <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center">
            <span className="text-[10px] bg-white text-stone-700 px-2.5 py-1 rounded-full font-semibold">
              Tidak Tersedia
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3
          className="text-stone-900 font-medium leading-tight mb-1 truncate"
          style={{ fontFamily: "'Fraunces', serif", fontSize: '14px' }}
        >
          {item.name}
        </h3>

        {item.description && (
          <p className="text-xs text-stone-400 mb-3 leading-relaxed line-clamp-2">{item.description}</p>
        )}

        {/* Meta */}
        <div className="space-y-2 mb-3 mt-auto">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-stone-400">Harga/hari</span>
            <span className="text-xs font-semibold text-emerald-800">{formatCurrency(item.price_per_day)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-stone-400">Stok</span>
            <Badge className={`${stock.cls} text-[10px] font-medium shadow-none`}>{stock.label}</Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t border-stone-100">
          <Button
            variant="outline" size="sm" onClick={onEdit}
            className="flex-1 h-8 rounded-lg border-stone-200 text-stone-600 text-xs shadow-none gap-1 hover:border-stone-300"
          >
            <Edit className="w-3 h-3" /> Edit
          </Button>
          <Button
            variant="ghost" size="sm" onClick={onDelete}
            className="h-8 w-8 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 shadow-none p-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

// ── Main Page ──────────────────────────────────────────────────
export default function EquipmentManagement() {
  const router = useRouter()
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<Equipment | null>(null)

  const fetchEquipment = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setEquipment(data ?? [])
    } catch (err: any) {
      toast.error(err.message ?? 'Gagal memuat data produk')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchEquipment() }, [fetchEquipment])

  const handleSubmit = async (form: FormData) => {
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price_per_day: parseFloat(form.price_per_day),
        stock_quantity: parseInt(form.stock_quantity),
        category: form.category || null,
        image_url: form.image_url.trim() || null,
        is_available: form.is_available,
      }

      if (editingItem) {
        const { error } = await supabase.from('equipment').update(payload).eq('id', editingItem.id)
        if (error) throw error
        toast.success('Produk berhasil diperbarui!')
      } else {
        const { error } = await supabase.from('equipment').insert(payload)
        if (error) throw error
        toast.success('Produk berhasil ditambahkan!')
      }

      setShowModal(false)
      setEditingItem(null)
      fetchEquipment()
    } catch (err: any) {
      toast.error(err.message ?? 'Gagal menyimpan produk')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (item: Equipment) => {
    setEditingItem(item)
    setShowModal(true)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return
    try {
      const { error } = await supabase.from('equipment').delete().eq('id', id)
      if (error) throw error
      toast.success('Produk berhasil dihapus!')
      fetchEquipment()
    } catch (err: any) {
      toast.error(err.message ?? 'Gagal menghapus produk')
    }
  }

  const openAdd = () => {
    setEditingItem(null)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingItem(null)
  }

  // Filter
  const filtered = equipment.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchCat = !categoryFilter || item.category === categoryFilter
    return matchSearch && matchCat
  })

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1EFE8] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F1EFE8] font-body">

      {/* ── Header ── */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-20">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Button
              variant="ghost" size="sm"
              onClick={() => router.push('/admin')}
              className="h-8 px-2.5 text-xs text-stone-500 hover:text-stone-800 rounded-lg gap-1.5"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Kembali
            </Button>
            <span className="w-px h-4 bg-stone-200" />
            <h1
              className="text-base text-stone-900 font-medium tracking-tight"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Manajemen Produk
            </h1>
          </div>
          <Button
            size="sm" onClick={openAdd}
            className="h-8 px-3 text-xs bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg shadow-none gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tambah Produk</span>
            <span className="sm:hidden">Tambah</span>
          </Button>
        </div>
      </header>

      <div className="px-4 sm:px-6 py-6 space-y-5 max-w-[1400px] mx-auto">

        {/* ── Search & filter bar ── */}
        <Card className="px-4 py-3 bg-white border-stone-200 rounded-xl shadow-none">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
              <Input
                placeholder="Cari produk atau kategori..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm border-stone-200 bg-stone-50 rounded-lg focus:border-emerald-500 focus:bg-white"
              />
            </div>

            {/* Category filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 px-3 text-sm border border-stone-200 rounded-lg bg-stone-50 text-stone-700 outline-none focus:border-emerald-500 focus:bg-white transition-colors"
            >
              <option value="">Semua Kategori</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>

            {/* Count */}
            <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-md font-medium whitespace-nowrap">
              {filtered.length} produk
            </span>
          </div>
        </Card>

        {/* ── Grid ── */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
            {filtered.map((item) => (
              <EquipmentCard
                key={item.id}
                item={item}
                onEdit={() => handleEdit(item)}
                onDelete={() => handleDelete(item.id, item.name)}
              />
            ))}
          </div>
        ) : (
          /* Empty state */
          <Card className="bg-white border-stone-200 rounded-xl shadow-none py-16 text-center">
            <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-7 h-7 text-stone-300" />
            </div>
            <h3
              className="text-stone-800 font-medium mb-2"
              style={{ fontFamily: "'Fraunces', serif", fontSize: '16px' }}
            >
              {searchTerm || categoryFilter ? 'Produk tidak ditemukan' : 'Belum ada produk'}
            </h3>
            <p className="text-sm text-stone-400 mb-6 max-w-xs mx-auto">
              {searchTerm || categoryFilter
                ? 'Coba ubah kata kunci atau filter kategori.'
                : 'Mulai tambahkan perlengkapan yang tersedia untuk disewa.'}
            </p>
            {!searchTerm && !categoryFilter && (
              <Button
                size="sm" onClick={openAdd}
                className="h-9 px-5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-sm shadow-none gap-1.5"
              >
                <Plus className="w-4 h-4" /> Tambah Produk Pertama
              </Button>
            )}
            {(searchTerm || categoryFilter) && (
              <Button
                variant="outline" size="sm"
                onClick={() => { setSearchTerm(''); setCategoryFilter('') }}
                className="h-9 px-5 rounded-lg border-stone-200 text-stone-600 text-sm shadow-none"
              >
                Reset Filter
              </Button>
            )}
          </Card>
        )}
      </div>

      {/* ── Modal ── */}
      <EquipmentModal
        open={showModal}
        onClose={closeModal}
        onSubmit={handleSubmit}
        editingItem={editingItem}
        loading={saving}
      />
    </div>
  )
}