'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { OptimizedImage } from '@/components/optimized-image'
import { MarkdownEditor } from '@/components/ui/markdown-editor'
import {
  Package, Plus, Search, Edit, Trash2, X, ImagePlus,
  ChevronDown, ChevronLeft, ChevronRight, Link,
} from 'lucide-react'
import { toast } from 'sonner'

interface ShopProduct {
  id: string
  name: string
  description?: string
  price: number
  original_price?: number
  stock: number
  category?: string
  image_url?: string
  gallery_urls: string[]
  brand?: string
  specifications: Record<string, string>
  rating_label?: string
  weight_kg?: number
  dimensions?: string
  material?: string
  is_available: boolean
  is_featured: boolean
  is_new: boolean
  rating: number
  review_count: number
  sold_count: number
  created_at: string
  updated_at: string
}

type FormData = {
  name: string
  description: string
  price: string
  original_price: string
  stock: string
  category: string
  brand: string
  rating_label: string
  image_url: string
  gallery_urls: string[]
  weight_kg: string
  dimensions: string
  material: string
  specifications: string
  is_available: boolean
  is_featured: boolean
  is_new: boolean
}

const EMPTY_FORM: FormData = {
  name: '', description: '', price: '', original_price: '', stock: '0',
  category: '', brand: '', rating_label: '', image_url: '', gallery_urls: [],
  weight_kg: '', dimensions: '', material: '', specifications: '',
  is_available: true, is_featured: false, is_new: false,
}

const RATING_LABELS = ['Perlu Dioptimalkan', 'Sedang', 'Bagus', 'Bagus Sekali']

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

const stockInfo = (qty: number) => {
  if (qty === 0) return { cls: 'bg-red-50 text-red-800 border border-red-200', label: 'Habis' }
  if (qty <= 3) return { cls: 'bg-amber-50 text-amber-800 border border-amber-200', label: `${qty} unit` }
  return { cls: 'bg-emerald-50 text-emerald-800 border border-emerald-200', label: `${qty} unit` }
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <Label className="text-[10px] text-stone-400 font-medium uppercase tracking-widest">
      {children} {required && <span className="text-red-400">*</span>}
    </Label>
  )
}

function FieldError({ children }: { children?: string }) {
  if (!children) return null
  return <p className="text-[11px] text-red-500 font-medium mt-1">{children}</p>
}

function ProductModal({
  open, onClose, onSubmit, editingItem, loading,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (data: FormData) => Promise<void>
  editingItem: ShopProduct | null
  loading: boolean
}) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [galleryInput, setGalleryInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [weightUnit, setWeightUnit] = useState<'kg' | 'g'>('kg')
  const [selectedMedia, setSelectedMedia] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (editingItem) {
      setForm({
        name: editingItem.name,
        description: editingItem.description ?? '',
        price: editingItem.price.toString(),
        original_price: editingItem.original_price?.toString() ?? '',
        stock: editingItem.stock.toString(),
        category: editingItem.category ?? '',
        brand: editingItem.brand ?? '',
        rating_label: editingItem.rating_label ?? '',
        image_url: editingItem.image_url ?? '',
        gallery_urls: editingItem.gallery_urls ?? [],
        weight_kg: editingItem.weight_kg?.toString() ?? '',
        dimensions: editingItem.dimensions ?? '',
        material: editingItem.material ?? '',
        specifications: editingItem.specifications ? JSON.stringify(editingItem.specifications, null, 2) : '',
        is_available: editingItem.is_available,
        is_featured: editingItem.is_featured,
        is_new: editingItem.is_new,
      })
    } else {
      setForm(EMPTY_FORM)
    }
    setGalleryInput('')
    setSelectedMedia(0)
  }, [editingItem, open])

  if (!open) return null

  const set = (key: keyof FormData, val: string | boolean | string[]) => {
    setForm((f) => ({ ...f, [key]: val }))
    setErrors((prev) => (prev[key as string] ? { ...prev, [key as string]: '' } : prev))
  }

  const weightNum = parseFloat(form.weight_kg) || 0

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `shop/${path}-${Date.now()}.${fileExt}`
      const { data, error } = await supabase.storage
        .from('equipment')
        .upload(fileName, file, { cacheControl: '31536000', upsert: false })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('equipment').getPublicUrl(data.path)
      return urlData.publicUrl
    } catch (err: any) {
      toast.error(err.message || 'Gagal upload file')
      return null
    } finally {
      setUploading(false)
    }
  }

  const mediaImages = [form.image_url, ...form.gallery_urls].filter(Boolean)
  const activeMediaIdx = Math.min(selectedMedia, Math.max(0, mediaImages.length - 1))

  const setMedia = (list: string[]) => {
    const [main, ...rest] = list
    setForm((f) => ({ ...f, image_url: main ?? '', gallery_urls: rest }))
  }

  const handleMediaFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    for (const file of Array.from(files)) {
      const url = await uploadFile(file, `media-${Date.now()}`)
      if (url) setForm((f) => ({ ...f, gallery_urls: [...f.gallery_urls, url] }))
    }
  }

  const addMediaUrl = () => {
    const url = galleryInput.trim()
    if (url && /^https?:\/\//.test(url)) {
      setMedia([...mediaImages, url])
      setGalleryInput('')
    } else {
      toast.error('Masukkan URL gambar yang valid (https://...)')
    }
  }

  const removeMedia = (idx: number) => {
    setMedia(mediaImages.filter((_, i) => i !== idx))
  }

  const moveMedia = (idx: number, dir: -1 | 1) => {
    const next = idx + dir
    if (next < 0 || next >= mediaImages.length) return
    const list = [...mediaImages]
    ;[list[idx], list[next]] = [list[next], list[idx]]
    setMedia(list)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'Nama produk wajib diisi'
    if (!form.price.trim() || parseFloat(form.price) <= 0) errs.price = 'Harga jual wajib diisi'
    if (form.stock === '' || form.stock == null) errs.stock = 'Stok wajib diisi'
    if (!form.category.trim()) errs.category = 'Kategori wajib diisi'
    if (!form.brand.trim()) errs.brand = 'Brand wajib diisi'
    if (!form.rating_label.trim()) errs.rating_label = 'Penilaian wajib dipilih'
    if (mediaImages.length === 0) errs.media = 'Minimal tambahkan 1 gambar produk'

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      toast.error('Lengkapi semua kolom yang wajib diisi sebelum menyimpan')
      return
    }

    setErrors({})
    await onSubmit(form)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 sm:pt-12 bg-stone-900/50 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <Card className="w-full max-w-3xl bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden my-auto">
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

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Informasi Dasar */}
            <div>
              <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-1 h-3.5 rounded-full bg-emerald-600" />
                Informasi Dasar
              </h3>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <FieldLabel required>Nama Produk</FieldLabel>
                  <Input
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="cth. Tenda Dome 4 Orang"
                    className={`h-10 text-sm rounded-lg bg-stone-50 focus:bg-white ${errors.name ? 'border-red-400 focus:border-red-500' : 'border-stone-200 focus:border-emerald-500'}`}
                    required
                  />
                  <FieldError>{errors.name}</FieldError>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <FieldLabel required>Harga Jual (Rp)</FieldLabel>
                    <Input
                      type="number" min="0"
                      value={form.price}
                      onChange={(e) => set('price', e.target.value)}
                      placeholder="150000"
                      className={`h-10 text-sm rounded-lg bg-stone-50 focus:bg-white ${errors.price ? 'border-red-400 focus:border-red-500' : 'border-stone-200 focus:border-emerald-500'}`}
                      required
                    />
                    <FieldError>{errors.price}</FieldError>
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>Harga Asli (Rp)</FieldLabel>
                    <Input
                      type="number" min="0"
                      value={form.original_price}
                      onChange={(e) => set('original_price', e.target.value)}
                      placeholder="200000 (untuk coret)"
                      className="h-10 text-sm rounded-lg border-stone-200 bg-stone-50 focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <FieldLabel required>Stok</FieldLabel>
                    <Input
                      type="number" min="0"
                      value={form.stock}
                      onChange={(e) => set('stock', e.target.value)}
                      placeholder="0"
                      className={`h-10 text-sm rounded-lg bg-stone-50 focus:bg-white ${errors.stock ? 'border-red-400 focus:border-red-500' : 'border-stone-200 focus:border-emerald-500'}`}
                      required
                    />
                    <FieldError>{errors.stock}</FieldError>
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel required>Kategori</FieldLabel>
                    <Input
                      value={form.category}
                      onChange={(e) => set('category', e.target.value)}
                      placeholder="cth. Tenda, Sleeping Bag"
                      className={`h-10 text-sm rounded-lg bg-stone-50 focus:bg-white ${errors.category ? 'border-red-400 focus:border-red-500' : 'border-stone-200 focus:border-emerald-500'}`}
                    />
                    <FieldError>{errors.category}</FieldError>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <FieldLabel required>Brand</FieldLabel>
                    <Input
                      value={form.brand}
                      onChange={(e) => set('brand', e.target.value)}
                      placeholder="cth. Eiger, Coleman"
                      className={`h-10 text-sm rounded-lg bg-stone-50 focus:bg-white ${errors.brand ? 'border-red-400 focus:border-red-500' : 'border-stone-200 focus:border-emerald-500'}`}
                    />
                    <FieldError>{errors.brand}</FieldError>
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>Status</FieldLabel>
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

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_featured}
                      onChange={(e) => set('is_featured', e.target.checked)}
                      className="rounded border-stone-300 text-emerald-700 focus:ring-emerald-500"
                    />
                    Produk Unggulan
                  </label>
                  <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_new}
                      onChange={(e) => set('is_new', e.target.checked)}
                      className="rounded border-stone-300 text-emerald-700 focus:ring-emerald-500"
                    />
                    Produk Baru
                  </label>
                </div>

                <div className="space-y-1.5">
                  <FieldLabel required>Penilaian</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {RATING_LABELS.map((label) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => set('rating_label', label)}
                        className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                          form.rating_label === label
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-emerald-400 hover:text-emerald-700'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <FieldError>{errors.rating_label}</FieldError>
                </div>

                <div className="space-y-1.5">
                  <FieldLabel>Deskripsi</FieldLabel>
                  <MarkdownEditor
                    value={form.description}
                    onChange={(v) => set('description', v)}
                    placeholder="Deskripsi produk... (mendukung Markdown)"
                  />
                </div>
              </div>
            </div>

            {/* Spesifikasi Fisik */}
            <div>
              <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-1 h-3.5 rounded-full bg-emerald-600" />
                Spesifikasi Fisik
              </h3>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <FieldLabel>Berat</FieldLabel>
                  <div className="flex bg-stone-100 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => setWeightUnit('kg')}
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-colors ${
                        weightUnit === 'kg'
                          ? 'bg-white text-emerald-700 shadow-sm'
                          : 'text-stone-400 hover:text-stone-600'
                      }`}
                    >
                      kg
                    </button>
                    <button
                      type="button"
                      onClick={() => setWeightUnit('g')}
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-colors ${
                        weightUnit === 'g'
                          ? 'bg-white text-emerald-700 shadow-sm'
                          : 'text-stone-400 hover:text-stone-600'
                      }`}
                    >
                      g
                    </button>
                  </div>
                </div>
                <Input
                  type="number" min="0" step={weightUnit === 'kg' ? '0.01' : '1'}
                  value={weightUnit === 'kg' ? form.weight_kg : weightNum > 0 ? Math.round(weightNum * 1000).toString() : ''}
                  onChange={(e) =>
                    set(
                      'weight_kg',
                      weightUnit === 'kg'
                        ? e.target.value
                        : e.target.value === ''
                          ? ''
                          : (parseFloat(e.target.value) / 1000).toString()
                    )
                  }
                  placeholder={weightUnit === 'kg' ? 'cth. 2.5' : 'cth. 2500'}
                  className="h-10 text-sm rounded-lg border-stone-200 bg-stone-50 focus:border-emerald-500 focus:bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="space-y-1.5">
                  <FieldLabel>Dimensi</FieldLabel>
                  <Input
                    value={form.dimensions}
                    onChange={(e) => set('dimensions', e.target.value)}
                    placeholder="cth. 50x30x20 cm"
                    className="h-10 text-sm rounded-lg border-stone-200 bg-stone-50 focus:border-emerald-500 focus:bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>Material</FieldLabel>
                  <Input
                    value={form.material}
                    onChange={(e) => set('material', e.target.value)}
                    placeholder="cth. Polyester 210T"
                    className="h-10 text-sm rounded-lg border-stone-200 bg-stone-50 focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>
              <div className="space-y-1.5 mt-3">
                <FieldLabel>Spesifikasi Lainnya (JSON)</FieldLabel>
                <textarea
                  value={form.specifications}
                  onChange={(e) => set('specifications', e.target.value)}
                  placeholder='{"Warna": "Hijau Army", "Tipe": "Dome"}'
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm border border-stone-200 rounded-lg bg-stone-50 focus:border-emerald-500 focus:bg-white outline-none transition-colors resize-none font-mono"
                />
              </div>
            </div>

            {/* Media */}
            <div>
              <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-1 h-3.5 rounded-full bg-emerald-600" />
                Media
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FieldLabel>Media Produk</FieldLabel>
                  <span className="text-[10px] text-stone-400 font-medium">
                    {mediaImages.length} gambar
                  </span>
                </div>
                <FieldError>{errors.media}</FieldError>

                <div className="relative rounded-xl overflow-hidden border border-stone-200 aspect-video bg-stone-100 group">
                  {mediaImages[activeMediaIdx] ? (
                    <>
                      <OptimizedImage
                        src={mediaImages[activeMediaIdx]}
                        alt={`Preview ${activeMediaIdx + 1}`}
                        className="w-full h-full object-cover"
                        width={640}
                        height={360}
                      />
                      <button
                        type="button"
                        onClick={() => removeMedia(activeMediaIdx)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-white" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 h-full text-stone-400">
                      <ImagePlus className="w-10 h-10" />
                      <p className="text-sm font-medium">Belum ada gambar</p>
                      <p className="text-xs">Tambahkan lewat strip di bawah</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                  {mediaImages.map((url, idx) => (
                    <div
                      key={idx}
                      className={`relative group rounded-lg overflow-hidden w-16 h-16 shrink-0 border-2 transition-colors cursor-pointer ${
                        activeMediaIdx === idx
                          ? 'border-emerald-600 ring-2 ring-emerald-600/20'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                      onClick={() => setSelectedMedia(idx)}
                    >
                      <OptimizedImage src={url} alt={`Media ${idx + 1}`} className="w-full h-full object-cover" width={64} height={64} />
                      {idx === 0 && (
                        <span className="absolute bottom-0 inset-x-0 text-center text-[8px] font-bold uppercase tracking-wide bg-emerald-600 text-white py-0.5">
                          Utama
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveMedia(idx, -1)}
                          className="w-5 h-5 rounded-full bg-white/90 flex items-center justify-center hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft className="w-3 h-3 text-stone-700" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === mediaImages.length - 1}
                          onClick={() => moveMedia(idx, 1)}
                          className="w-5 h-5 rounded-full bg-white/90 flex items-center justify-center hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronRight className="w-3 h-3 text-stone-700" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeMedia(idx)}
                          className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <label className="w-16 h-16 shrink-0 rounded-lg border-2 border-dashed border-stone-300 bg-stone-50 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors">
                    <ImagePlus className="w-4 h-4 text-stone-400" />
                    <span className="text-[9px] text-stone-500 font-medium">
                      {uploading ? '...' : 'Tambah'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleMediaFiles(e.target.files)}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex gap-2">
                  <Input
                    type="url"
                    value={galleryInput}
                    onChange={(e) => setGalleryInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMediaUrl())}
                    placeholder="Atau tempel URL gambar... https://..."
                    className="h-10 text-sm rounded-lg border-stone-200 bg-stone-50 focus:border-emerald-500 focus:bg-white flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={addMediaUrl}
                    disabled={!galleryInput.trim()}
                    className="h-10 px-3 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 shadow-none"
                  >
                    <Link className="w-4 h-4" />
                  </Button>
                </div>
              </div>
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
              {loading ? 'Menyimpan...' : editingItem ? 'Simpan Perubahan' : 'Tambah Produk'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

function ProductCard({
  item, onEdit, onDelete,
}: { item: ShopProduct; onEdit: () => void; onDelete: () => void }) {
  const stock = stockInfo(item.stock)
  const hasDiscount = item.original_price && item.original_price > item.price

  return (
    <Card className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-none hover:border-stone-300 hover:shadow-sm transition-all duration-200 flex flex-col">
      <div className="relative h-40 bg-stone-100 flex items-center justify-center overflow-hidden flex-shrink-0">
        {item.image_url ? (
          <OptimizedImage src={item.image_url} alt={item.name} className="w-full h-full object-cover" width={320} height={160} />
        ) : (
          <Package className="w-10 h-10 text-stone-300" />
        )}
        {item.category && (
          <span className="absolute top-2.5 left-2.5 text-[10px] bg-white/90 backdrop-blur-sm text-stone-700 px-2 py-0.5 rounded-full font-medium border border-stone-200">
            {item.category}
          </span>
        )}
        {item.is_new && (
          <span className="absolute top-2.5 right-2.5 text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-bold">
            BARU
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

        {item.rating_label && (
          <span className="inline-block mb-3 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            {item.rating_label}
          </span>
        )}

        <div className="space-y-2 mb-3 mt-auto">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-stone-400">Harga</span>
            <div className="flex items-center gap-1.5">
              {hasDiscount && (
                <span className="text-[10px] text-stone-400 line-through">{formatCurrency(item.original_price!)}</span>
              )}
              <span className="text-xs font-semibold text-emerald-800">{formatCurrency(item.price)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-stone-400">Stok</span>
            <Badge className={`${stock.cls} text-[10px] font-medium shadow-none`}>{stock.label}</Badge>
          </div>
          {item.sold_count > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-stone-400">Terjual</span>
              <span className="text-xs text-stone-500">{item.sold_count}</span>
            </div>
          )}
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
      </div>
    </Card>
  )
}

export default function CatalogShopManagement() {
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<ShopProduct | null>(null)

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/catalog-shop')
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setProducts(json.data ?? [])
    } catch (err: any) {
      toast.error(err.message ?? 'Gagal memuat data produk')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const handleSubmit = async (form: FormData) => {
    setSaving(true)
    try {
      let specs: Record<string, string> | null = null
      if (form.specifications.trim()) {
        try {
          specs = JSON.parse(form.specifications)
        } catch {
          toast.error('Format JSON spesifikasi tidak valid')
          setSaving(false)
          return
        }
      }

      const payload: Record<string, any> = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: parseFloat(form.price) || 0,
        original_price: form.original_price ? parseFloat(form.original_price) : null,
        stock: parseInt(form.stock) || 0,
        category: form.category.trim() || null,
        image_url: form.image_url.trim() || null,
        gallery_urls: form.gallery_urls,
        brand: form.brand.trim() || null,
        rating_label: form.rating_label.trim() || null,
        specifications: specs ?? {},
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        dimensions: form.dimensions.trim() || null,
        material: form.material.trim() || null,
        is_available: form.is_available,
        is_featured: form.is_featured,
        is_new: form.is_new,
      }

      let res: Response
      if (editingItem) {
        res = await fetch('/api/admin/catalog-shop', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingItem.id, ...payload }),
        })
      } else {
        res = await fetch('/api/admin/catalog-shop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      const json = await res.json()
      if (!json.success) throw new Error(json.error)

      toast.success(editingItem ? 'Produk berhasil diperbarui!' : 'Produk berhasil ditambahkan!')
      setShowModal(false)
      setEditingItem(null)
      fetchProducts()
    } catch (err: any) {
      toast.error(err.message ?? 'Gagal menyimpan produk')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (item: ShopProduct) => {
    setEditingItem(item)
    setShowModal(true)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return
    try {
      const res = await fetch(`/api/admin/catalog-shop?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      toast.success('Produk berhasil dihapus!')
      fetchProducts()
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

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))]

  const filtered = products.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchCat = !categoryFilter || item.category === categoryFilter
    return matchSearch && matchCat
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1EFE8] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F1EFE8] font-body">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-20">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <h1
            className="text-base text-stone-900 font-medium tracking-tight"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Katalog Toko
          </h1>
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
        <Card className="px-4 py-3 bg-white border-stone-200 rounded-xl shadow-none">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
              <Input
                placeholder="Cari produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm border-stone-200 bg-stone-50 rounded-lg focus:border-emerald-500 focus:bg-white"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 px-3 text-sm border border-stone-200 rounded-lg bg-stone-50 text-stone-700 outline-none focus:border-emerald-500 focus:bg-white transition-colors"
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>

            <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-md font-medium whitespace-nowrap">
              {filtered.length} produk
            </span>
          </div>
        </Card>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
            {filtered.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                onEdit={() => handleEdit(item)}
                onDelete={() => handleDelete(item.id, item.name)}
              />
            ))}
          </div>
        ) : (
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
                : 'Mulai tambahkan produk yang dijual di toko.'}
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

      <ProductModal
        open={showModal}
        onClose={closeModal}
        onSubmit={handleSubmit}
        editingItem={editingItem}
        loading={saving}
      />
    </div>
  )
}

import { supabase } from '@/lib/supabaseClient'
