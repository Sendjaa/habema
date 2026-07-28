'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, Plus, Edit, Trash2, Tag, X, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

// ── Types ──────────────────────────────────────────────────────
interface Discount {
  id: string
  code: string
  description: string | null
  discount_type: string
  discount_value: number
  min_purchase: number | null
  max_discount: number | null
  start_date: string | null
  end_date: string | null
  is_active: boolean
  applies_to: string
  target_id: string | null
  usage_limit: number | null
  usage_count: number
  created_at: string
  updated_at: string
}

type FormData = {
  code: string
  description: string
  discount_type: string
  discount_value: string
  min_purchase: string
  max_discount: string
  applies_to: string
  target_id: string
  start_date: string
  end_date: string
  is_active: boolean
  usage_limit: string
}

const EMPTY_FORM: FormData = {
  code: '', description: '', discount_type: 'percentage', discount_value: '',
  min_purchase: '', max_discount: '', applies_to: 'all', target_id: '',
  start_date: '', end_date: '', is_active: true, usage_limit: '',
}

const DISCOUNT_TYPES = [
  { value: 'percentage', label: 'Persentase (%)' },
  { value: 'fixed', label: 'Nominal (Rp)' },
]

const APPLIES_TO = [
  { value: 'all', label: 'Semua Produk' },
  { value: 'category', label: 'Kategori' },
  { value: 'equipment', label: 'Produk Tertentu' },
]

// ── Helpers ────────────────────────────────────────────────────
const formatCurrency = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

const formatDate = (d: string | null) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const discountBadge = (type: string, value: number) => {
  if (type === 'percentage') return `${value}%`
  return formatCurrency(value)
}

const statusBadge = (active: boolean, endDate: string | null) => {
  if (endDate && new Date(endDate) < new Date()) {
    return { cls: 'bg-red-50 text-red-700 border border-red-200', label: 'Kedaluwarsa' }
  }
  if (!active) return { cls: 'bg-stone-50 text-stone-500 border border-stone-200', label: 'Nonaktif' }
  return { cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200', label: 'Aktif' }
}

// ── Modal ──────────────────────────────────────────────────────
function DiscountModal({
  open, onClose, onSubmit, editingItem, loading,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (data: FormData) => Promise<void>
  editingItem: Discount | null
  loading: boolean
}) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM)

  useEffect(() => {
    if (editingItem) {
      setForm({
        code: editingItem.code,
        description: editingItem.description ?? '',
        discount_type: editingItem.discount_type,
        discount_value: editingItem.discount_value.toString(),
        min_purchase: editingItem.min_purchase?.toString() ?? '',
        max_discount: editingItem.max_discount?.toString() ?? '',
        applies_to: editingItem.applies_to,
        target_id: editingItem.target_id ?? '',
        start_date: editingItem.start_date ? editingItem.start_date.slice(0, 10) : '',
        end_date: editingItem.end_date ? editingItem.end_date.slice(0, 10) : '',
        is_active: editingItem.is_active,
        usage_limit: editingItem.usage_limit?.toString() ?? '',
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
      <Card className="w-full max-w-lg bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Tag className="w-4 h-4 text-emerald-700" />
            </div>
            <h2 className="text-sm font-medium text-stone-900" style={{ fontFamily: "'Fraunces', serif" }}>
              {editingItem ? 'Edit Diskon' : 'Tambah Diskon Baru'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg border border-stone-200 flex items-center justify-center text-stone-400 hover:bg-stone-50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-5 py-4 space-y-3.5 max-h-[65vh] overflow-y-auto">
            {/* Kode + Tipe Diskon */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] text-stone-400 font-medium uppercase tracking-widest">
                  Kode Diskon <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={form.code}
                  onChange={(e) => set('code', e.target.value.toUpperCase())}
                  placeholder="cth. HEMAT50"
                  className="h-10 text-sm rounded-lg border-stone-200 bg-stone-50 focus:border-emerald-500 focus:bg-white font-mono tracking-wider"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] text-stone-400 font-medium uppercase tracking-widest">
                  Tipe Diskon
                </Label>
                <select
                  value={form.discount_type}
                  onChange={(e) => set('discount_type', e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-stone-200 rounded-lg bg-stone-50 focus:border-emerald-500 focus:bg-white outline-none transition-colors text-stone-800"
                >
                  {DISCOUNT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>

            {/* Nilai Diskon */}
            <div className="space-y-1.5">
              <Label className="text-[10px] text-stone-400 font-medium uppercase tracking-widest">
                {form.discount_type === 'percentage' ? 'Nilai Diskon (%)' : 'Nilai Diskon (Rp)'} <span className="text-red-400">*</span>
              </Label>
              <Input
                type="number" min="0"
                value={form.discount_value}
                onChange={(e) => set('discount_value', e.target.value)}
                placeholder={form.discount_type === 'percentage' ? 'cth. 10' : 'cth. 25000'}
                className="h-10 text-sm rounded-lg border-stone-200 bg-stone-50 focus:border-emerald-500 focus:bg-white"
                required
              />
            </div>

            {/* Min Purchase + Max Discount */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] text-stone-400 font-medium uppercase tracking-widest">
                  Min. Pembelian (Rp)
                </Label>
                <Input
                  type="number" min="0"
                  value={form.min_purchase}
                  onChange={(e) => set('min_purchase', e.target.value)}
                  placeholder="0 = tanpa minimal"
                  className="h-10 text-sm rounded-lg border-stone-200 bg-stone-50 focus:border-emerald-500 focus:bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] text-stone-400 font-medium uppercase tracking-widest">
                  Maks. Diskon (Rp)
                </Label>
                <Input
                  type="number" min="0"
                  value={form.max_discount}
                  onChange={(e) => set('max_discount', e.target.value)}
                  placeholder="Kosongkan = tanpa batas"
                  className="h-10 text-sm rounded-lg border-stone-200 bg-stone-50 focus:border-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Berlaku Untuk */}
            <div className="space-y-1.5">
              <Label className="text-[10px] text-stone-400 font-medium uppercase tracking-widest">
                Berlaku Untuk
              </Label>
              <select
                value={form.applies_to}
                onChange={(e) => set('applies_to', e.target.value)}
                className="w-full h-10 px-3 text-sm border border-stone-200 rounded-lg bg-stone-50 focus:border-emerald-500 focus:bg-white outline-none transition-colors text-stone-800"
              >
                {APPLIES_TO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            {/* Target ID */}
            {form.applies_to !== 'all' && (
              <div className="space-y-1.5">
                <Label className="text-[10px] text-stone-400 font-medium uppercase tracking-widest">
                  ID Kategori / Produk
                </Label>
                <Input
                  value={form.target_id}
                  onChange={(e) => set('target_id', e.target.value)}
                  placeholder="UUID kategori atau produk"
                  className="h-10 text-sm rounded-lg border-stone-200 bg-stone-50 focus:border-emerald-500 focus:bg-white"
                />
              </div>
            )}

            {/* Periode */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] text-stone-400 font-medium uppercase tracking-widest">
                  Tanggal Mulai
                </Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => set('start_date', e.target.value)}
                  className="h-10 text-sm rounded-lg border-stone-200 bg-stone-50 focus:border-emerald-500 focus:bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] text-stone-400 font-medium uppercase tracking-widest">
                  Tanggal Berakhir
                </Label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => set('end_date', e.target.value)}
                  className="h-10 text-sm rounded-lg border-stone-200 bg-stone-50 focus:border-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Status + Usage Limit */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] text-stone-400 font-medium uppercase tracking-widest">Status</Label>
                <select
                  value={String(form.is_active)}
                  onChange={(e) => set('is_active', e.target.value === 'true')}
                  className="w-full h-10 px-3 text-sm border border-stone-200 rounded-lg bg-stone-50 focus:border-emerald-500 focus:bg-white outline-none transition-colors text-stone-800"
                >
                  <option value="true">Aktif</option>
                  <option value="false">Nonaktif</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] text-stone-400 font-medium uppercase tracking-widest">
                  Batas Pemakaian
                </Label>
                <Input
                  type="number" min="0"
                  value={form.usage_limit}
                  onChange={(e) => set('usage_limit', e.target.value)}
                  placeholder="Kosongkan = tanpa batas"
                  className="h-10 text-sm rounded-lg border-stone-200 bg-stone-50 focus:border-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Deskripsi */}
            <div className="space-y-1.5">
              <Label className="text-[10px] text-stone-400 font-medium uppercase tracking-widest">Deskripsi</Label>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Deskripsi singkat promo..."
                rows={2}
                className="w-full px-3 py-2.5 text-sm border border-stone-200 rounded-lg bg-stone-50 focus:border-emerald-500 focus:bg-white outline-none transition-colors resize-none font-body"
              />
            </div>
          </div>

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
              {loading ? 'Menyimpan...' : editingItem ? 'Simpan Perubahan' : 'Tambah Diskon'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

// ── Table Row ──────────────────────────────────────────────────
function DiscountRow({
  item, onEdit, onDelete,
}: { item: Discount; onEdit: () => void; onDelete: () => void }) {
  const status = statusBadge(item.is_active, item.end_date)
  const usageLeft = item.usage_limit ? item.usage_limit - item.usage_count : null

  return (
    <tr className="border-b border-stone-100 hover:bg-stone-50/60 transition-colors">
      <td className="py-3.5 px-4">
        <span className="font-mono font-bold text-sm text-emerald-800 tracking-wider">{item.code}</span>
      </td>
      <td className="py-3.5 px-4 text-sm text-stone-600 max-w-[220px] truncate">
        {item.description || '—'}
      </td>
      <td className="py-3.5 px-4">
        <span className="text-sm font-semibold text-stone-800">
          {discountBadge(item.discount_type, item.discount_value)}
        </span>
        <span className="text-[10px] text-stone-400 ml-1.5">
          {item.discount_type === 'percentage' ? '%' : 'fixed'}
        </span>
      </td>
      <td className="py-3.5 px-4">
        <span className="text-[10px] bg-stone-50 text-stone-600 border border-stone-200 px-2 py-0.5 rounded-full font-medium">
          {APPLIES_TO.find((a) => a.value === item.applies_to)?.label || item.applies_to}
        </span>
      </td>
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-2">
          <Badge className={`${status.cls} text-[10px] font-medium shadow-none`}>{status.label}</Badge>
        </div>
      </td>
      <td className="py-3.5 px-4 text-sm text-stone-500 whitespace-nowrap">
        {usageLeft !== null ? `${item.usage_count}/${item.usage_limit}` : item.usage_count}
      </td>
      <td className="py-3.5 px-4 text-sm text-stone-500 whitespace-nowrap">
        {item.start_date || item.end_date ? (
          <span title={`${formatDate(item.start_date)} — ${formatDate(item.end_date)}`}>
            {formatDate(item.start_date)} — {formatDate(item.end_date)}
          </span>
        ) : '—'}
      </td>
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost" size="sm" onClick={onEdit}
            className="h-8 w-8 rounded-lg text-stone-400 hover:text-emerald-700 hover:bg-emerald-50 shadow-none p-0"
          >
            <Edit className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost" size="sm" onClick={onDelete}
            className="h-8 w-8 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 shadow-none p-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  )
}

// ── Mobile Card ────────────────────────────────────────────────
function DiscountCard({
  item, onEdit, onDelete,
}: { item: Discount; onEdit: () => void; onDelete: () => void }) {
  const status = statusBadge(item.is_active, item.end_date)

  return (
    <Card className="bg-white border border-stone-200 rounded-xl shadow-none p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="font-mono font-bold text-sm text-emerald-800 tracking-wider">{item.code}</span>
          {item.description && (
            <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">{item.description}</p>
          )}
        </div>
        <Badge className={`${status.cls} text-[10px] font-medium shadow-none shrink-0`}>{status.label}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-stone-500 mb-3">
        <div>
          <span className="text-stone-400">Diskon:</span>{' '}
          <span className="font-semibold text-stone-700">{discountBadge(item.discount_type, item.discount_value)}</span>
        </div>
        <div>
          <span className="text-stone-400">Berlaku:</span>{' '}
          <span className="font-medium">{APPLIES_TO.find((a) => a.value === item.applies_to)?.label || item.applies_to}</span>
        </div>
        <div>
          <span className="text-stone-400">Pemakaian:</span>{' '}
          <span className="font-medium">{item.usage_count}{item.usage_limit ? `/${item.usage_limit}` : ''}</span>
        </div>
        <div>
          <span className="text-stone-400">Periode:</span>{' '}
          <span>{formatDate(item.start_date)}</span>
        </div>
      </div>
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
    </Card>
  )
}

// ── Main Page ──────────────────────────────────────────────────
export default function DiscountManagement() {
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<Discount | null>(null)

  const fetchDiscounts = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('discounts')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setDiscounts(data ?? [])
    } catch (err: any) {
      toast.error(err.message ?? 'Gagal memuat data diskon')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDiscounts() }, [fetchDiscounts])

  const handleSubmit = async (form: FormData) => {
    setSaving(true)
    try {
      const payload = {
        code: form.code.trim(),
        description: form.description.trim() || null,
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        min_purchase: form.min_purchase ? parseFloat(form.min_purchase) : null,
        max_discount: form.max_discount ? parseFloat(form.max_discount) : null,
        applies_to: form.applies_to,
        target_id: form.target_id.trim() || null,
        start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
        end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
        is_active: form.is_active,
        usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
      }

      if (editingItem) {
        const { error } = await supabase.from('discounts').update(payload).eq('id', editingItem.id)
        if (error) throw error
        toast.success('Diskon berhasil diperbarui!')
      } else {
        const { error } = await supabase.from('discounts').insert(payload)
        if (error) {
          if (error.message?.includes('discounts_code_key')) {
            toast.error('Kode diskon sudah digunakan. Gunakan kode lain.')
          } else {
            throw error
          }
          return
        }
        toast.success('Diskon berhasil ditambahkan!')
      }

      setShowModal(false)
      setEditingItem(null)
      fetchDiscounts()
    } catch (err: any) {
      toast.error(err.message ?? 'Gagal menyimpan diskon')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (item: Discount) => {
    setEditingItem(item)
    setShowModal(true)
  }

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Hapus diskon "${code}"? Tindakan ini tidak dapat dibatalkan.`)) return
    try {
      const { error } = await supabase.from('discounts').delete().eq('id', id)
      if (error) throw error
      toast.success('Diskon berhasil dihapus!')
      fetchDiscounts()
    } catch (err: any) {
      toast.error(err.message ?? 'Gagal menghapus diskon')
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
  const filtered = discounts.filter((item) => {
    const matchSearch =
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus =
      !statusFilter ||
      (statusFilter === 'active' && item.is_active && (!item.end_date || new Date(item.end_date) >= new Date())) ||
      (statusFilter === 'expired' && item.end_date && new Date(item.end_date) < new Date()) ||
      (statusFilter === 'inactive' && !item.is_active)
    return matchSearch && matchStatus
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
      <div className="px-4 sm:px-6 py-6 space-y-5 max-w-[1400px] mx-auto mt-4">
        {/* ── Search & filter bar ── */}
        <Card className="px-4 py-3 bg-white border-stone-200 rounded-xl shadow-none">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
              <Input
                placeholder="Cari kode atau deskripsi diskon..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm border-stone-200 bg-stone-50 rounded-lg focus:border-emerald-500 focus:bg-white"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 text-sm border border-stone-200 rounded-lg bg-stone-50 text-stone-700 outline-none focus:border-emerald-500 focus:bg-white transition-colors"
            >
              <option value="">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="expired">Kedaluwarsa</option>
              <option value="inactive">Nonaktif</option>
            </select>

            <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-md font-medium whitespace-nowrap">
              {filtered.length} diskon
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
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">Kode</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">Deskripsi</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">Diskon</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">Berlaku</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">Status</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">Dipakai</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">Periode</th>
                    <th className="text-right py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <DiscountRow
                      key={item.id}
                      item={item}
                      onEdit={() => handleEdit(item)}
                      onDelete={() => handleDelete(item.id, item.code)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Mobile Cards ── */}
            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered.map((item) => (
                <DiscountCard
                  key={item.id}
                  item={item}
                  onEdit={() => handleEdit(item)}
                  onDelete={() => handleDelete(item.id, item.code)}
                />
              ))}
            </div>
          </>
        ) : (
          /* Empty state */
          <Card className="bg-white border-stone-200 rounded-xl shadow-none py-16 text-center">
            <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Tag className="w-7 h-7 text-stone-300" />
            </div>
            <h3 className="text-stone-800 font-medium mb-2" style={{ fontFamily: "'Fraunces', serif", fontSize: '16px' }}>
              {searchTerm || statusFilter ? 'Diskon tidak ditemukan' : 'Belum ada diskon'}
            </h3>
            <p className="text-sm text-stone-400 mb-6 max-w-xs mx-auto">
              {searchTerm || statusFilter
                ? 'Coba ubah kata kunci atau filter status.'
                : 'Mulai tambahkan kode promo dan diskon untuk pelanggan.'}
            </p>
            {!searchTerm && !statusFilter && (
              <Button
                size="sm" onClick={openAdd}
                className="h-9 px-5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-sm shadow-none gap-1.5"
              >
                <Plus className="w-4 h-4" /> Tambah Diskon Pertama
              </Button>
            )}
            {(searchTerm || statusFilter) && (
              <Button
                variant="outline" size="sm"
                onClick={() => { setSearchTerm(''); setStatusFilter('') }}
                className="h-9 px-5 rounded-lg border-stone-200 text-stone-600 text-sm shadow-none"
              >
                Reset Filter
              </Button>
            )}
          </Card>
        )}
      </div>

      {/* ── Modal ── */}
      <DiscountModal
        open={showModal}
        onClose={closeModal}
        onSubmit={handleSubmit}
        editingItem={editingItem}
        loading={saving}
      />
    </div>
  )
}
