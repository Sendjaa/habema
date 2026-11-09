'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Plus, Search, Edit, Trash2, Package, X, AlertTriangle,
  ChevronDown, GripVertical, ImagePlus, Upload, Link, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { invalidateFeaturedProducts } from '@/lib/featured-cache'
import { OptimizedImage } from '@/components/optimized-image'
import { activities as activityCatalog } from '@/lib/activities'

interface Equipment {
  id: string
  name: string
  description?: string
  detailed_description?: string
  category_id?: string
  category?: string
  price_per_day: number
  price_per_night: number
  stock_quantity: number
  is_available: boolean
  is_active?: boolean
  activities?: string[]
  image_url?: string
  gallery_urls?: string[]
  brand?: string
  capacity?: string
  weight_kg?: number
  dimensions?: string
  material?: string
  weather_rating?: string
  specifications?: Record<string, string>
  is_promo?: boolean
  discount_percentage?: number
  promo_price_per_night?: number
  promo_start_date?: string
  promo_end_date?: string
  created_at: string
  updated_at: string
}

interface Category {
  id: string
  name: string
  description?: string
}

type FormData = {
  name: string
  category_id: string
  brand: string
  description: string
  detailed_description: string
  price_per_day: string
  price_per_night: string
  stock_quantity: string
  is_available: boolean
  is_active: boolean
  activities: string[]
  image_url: string
  gallery_urls: string[]
  capacity: string
  weight_kg: string
  dimensions: string
  material: string
  weather_rating: string
  specifications: string
  is_promo: boolean
  discount_percentage: string
  promo_price_per_night: string
  promo_start_date: string
  promo_end_date: string
}

const EMPTY_FORM: FormData = {
  name: '', category_id: '', brand: '', description: '', detailed_description: '',
  price_per_day: '', price_per_night: '', stock_quantity: '',
  is_available: true, is_active: true,
  activities: [],
  image_url: '', gallery_urls: [],
  capacity: '', weight_kg: '', dimensions: '', material: '', weather_rating: '',
  specifications: '',
  is_promo: false, discount_percentage: '', promo_price_per_night: '',
  promo_start_date: '', promo_end_date: '',
}

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

function EquipmentModal({
  open, onClose, onSubmit, editingItem, loading, categories,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (data: FormData) => Promise<void>
  editingItem: Equipment | null
  loading: boolean
  categories: Category[]
}) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [showPromo, setShowPromo] = useState(false)
  const [galleryInput, setGalleryInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [imageTab, setImageTab] = useState<'url' | 'file'>('url')
  const [galleryTab, setGalleryTab] = useState<'url' | 'file'>('url')

  useEffect(() => {
    if (editingItem) {
      setForm({
        name: editingItem.name,
        category_id: editingItem.category_id ?? '',
        brand: editingItem.brand ?? '',
        description: editingItem.description ?? '',
        detailed_description: editingItem.detailed_description ?? '',
        price_per_day: editingItem.price_per_day.toString(),
        price_per_night: editingItem.price_per_night.toString(),
        stock_quantity: editingItem.stock_quantity.toString(),
        is_available: editingItem.is_available,
        is_active: editingItem.is_active ?? true,
        activities: editingItem.activities ?? [],
        image_url: editingItem.image_url ?? '',
        gallery_urls: editingItem.gallery_urls ?? [],
        capacity: editingItem.capacity ?? '',
        weight_kg: editingItem.weight_kg?.toString() ?? '',
        dimensions: editingItem.dimensions ?? '',
        material: editingItem.material ?? '',
        weather_rating: editingItem.weather_rating ?? '',
        specifications: editingItem.specifications ? JSON.stringify(editingItem.specifications, null, 2) : '',
        is_promo: editingItem.is_promo ?? false,
        discount_percentage: editingItem.discount_percentage?.toString() ?? '',
        promo_price_per_night: editingItem.promo_price_per_night?.toString() ?? '',
        promo_start_date: editingItem.promo_start_date ?? '',
        promo_end_date: editingItem.promo_end_date ?? '',
      })
      setShowPromo(editingItem.is_promo ?? false)
    } else {
      setForm(EMPTY_FORM)
      setShowPromo(false)
    }
    setGalleryInput('')
  }, [editingItem, open])

  if (!open) return null

  const set = (key: keyof FormData, val: string | boolean | string[]) =>
    setForm((f) => ({ ...f, [key]: val }))

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${path}-${Date.now()}.${fileExt}`
      const { data, error } = await supabase.storage
        .from('equipment')
        .upload(fileName, file, {
          cacheControl: '31536000',
          upsert: false,
        })
      if (error) throw error
      const { data: urlData } = supabase.storage
        .from('equipment')
        .getPublicUrl(data.path)
      return urlData.publicUrl
    } catch (err: any) {
      toast.error(err.message || 'Gagal upload file')
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await uploadFile(file, 'main')
    if (url) set('image_url', url)
    e.target.value = ''
  }

  const handleGalleryFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await uploadFile(file, `gallery-${form.gallery_urls.length}`)
    if (url) set('gallery_urls', [...form.gallery_urls, url])
    e.target.value = ''
  }

  const addGalleryUrl = () => {
    const url = galleryInput.trim()
    if (url && /^https?:\/\//.test(url)) {
      set('gallery_urls', [...form.gallery_urls, url])
      setGalleryInput('')
    }
  }

  const removeGalleryUrl = (idx: number) => {
    set('gallery_urls', form.gallery_urls.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(form)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 sm:pt-12 bg-stone-900/50 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <Card className="w-full max-w-2xl bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden my-auto">
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
          <div className="px-5 py-4 space-y-5 max-h-[65vh] overflow-y-auto">

            {/* ── Informasi Dasar ── */}
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
                    className="h-10 text-sm rounded-lg border-stone-200 bg-stone-50 focus:border-emerald-500 focus:bg-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <FieldLabel required>Kategori</FieldLabel>
                    <select
                      value={form.category_id}
                      onChange={(e) => set('category_id', e.target.value)}
                      className="w-full h-10 px-3 text-sm border border-stone-200 rounded-lg bg-stone-50 focus:border-emerald-500 focus:bg-white outline-none transition-colors text-stone-800"
                      required
                    >
                      <option value="">Pilih kategori</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>Brand/Merk</FieldLabel>
                    <Input
                      value={form.brand}
                      onChange={(e) => set('brand', e.target.value)}
                      placeholder="cth. Coleman, Eiger"
                      className="h-10 text-sm rounded-lg border-stone-200 bg-stone-50 focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <FieldLabel>Deskripsi Singkat</FieldLabel>
                  <textarea
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                    placeholder="Deskripsi singkat yang muncul di kartu produk..."
                    rows={2}
                    className="w-full px-3 py-2.5 text-sm border border-stone-200 rounded-lg bg-stone-50 focus:border-emerald-500 focus:bg-white outline-none transition-colors resize-none font-body"
                  />
                </div>

                <div className="space-y-1.5">
                  <FieldLabel>Deskripsi Detail</FieldLabel>
                  <textarea
                    value={form.detailed_description}
                    onChange={(e) => set('detailed_description', e.target.value)}
                    placeholder="Deskripsi lengkap produk, spesifikasi, dan informasi tambahan..."
                    rows={4}
                    className="w-full px-3 py-2.5 text-sm border border-stone-200 rounded-lg bg-stone-50 focus:border-emerald-500 focus:bg-white outline-none transition-colors resize-none font-body"
                  />
                </div>
              </div>
            </div>

            {/* Kegiatan — sumber tile filter homepage & katalog */}
            <div>
              <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-1 h-3.5 rounded-full bg-emerald-600" />
                Kegiatan
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {activityCatalog.map((activity) => {
                  const checked = form.activities.includes(activity.slug)
                  return (
                    <label
                      key={activity.slug}
                      className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2.5 text-xs transition-colors ${
                        checked
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                          : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          set(
                            'activities',
                            e.target.checked
                              ? [...form.activities, activity.slug]
                              : form.activities.filter((slug) => slug !== activity.slug),
                          )
                        }
                        className="mt-0.5 rounded border-stone-300 text-emerald-700 focus:ring-emerald-500"
                      />
                      <span className="font-medium leading-tight">{activity.label}</span>
                    </label>
                  )
                })}
              </div>
              <p className="mt-2 text-[11px] text-stone-400">
                Pilih kegiatan yang memakai alat ini. Tile kegiatan di homepage
                hanya tampil bila ada alat yang ditandai.
              </p>
            </div>

            {/* ── Harga & Stok ── */}
            <div>
              <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-1 h-3.5 rounded-full bg-emerald-600" />
                Harga & Stok
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <FieldLabel required>Harga/Hari (Rp)</FieldLabel>
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
                  <FieldLabel required>Harga/Malam (Rp)</FieldLabel>
                  <Input
                    type="number" min="0"
                    value={form.price_per_night}
                    onChange={(e) => set('price_per_night', e.target.value)}
                    placeholder="75000"
                    className="h-10 text-sm rounded-lg border-stone-200 bg-stone-50 focus:border-emerald-500 focus:bg-white"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel required>Stok</FieldLabel>
                  <Input
                    type="number" min="0"
                    value={form.stock_quantity}
                    onChange={(e) => set('stock_quantity', e.target.value)}
                    placeholder="0"
                    className="h-10 text-sm rounded-lg border-stone-200 bg-stone-50 focus:border-emerald-500 focus:bg-white"
                    required
                  />
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
            </div>

            {/* ── Spesifikasi Fisik ── */}
            <div>
              <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-1 h-3.5 rounded-full bg-emerald-600" />
                Spesifikasi Fisik
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <FieldLabel>Berat (kg)</FieldLabel>
                  <Input
                    type="number" min="0" step="0.01"
                    value={form.weight_kg}
                    onChange={(e) => set('weight_kg', e.target.value)}
                    placeholder="2.5"
                    className="h-10 text-sm rounded-lg border-stone-200 bg-stone-50 focus:border-emerald-500 focus:bg-white"
                  />
                </div>
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
                  <FieldLabel>Kapasitas</FieldLabel>
                  <Input
                    value={form.capacity}
                    onChange={(e) => set('capacity', e.target.value)}
                    placeholder="cth. 4 Orang"
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
                <div className="space-y-1.5">
                  <FieldLabel>Ketahanan Cuaca</FieldLabel>
                  <Input
                    value={form.weather_rating}
                    onChange={(e) => set('weather_rating', e.target.value)}
                    placeholder="cth. Waterproof 3000mm"
                    className="h-10 text-sm rounded-lg border-stone-200 bg-stone-50 focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5 mt-3">
                <FieldLabel>Spesifikasi Lainnya (JSON)</FieldLabel>
                <textarea
                  value={form.specifications}
                  onChange={(e) => set('specifications', e.target.value)}
                  placeholder='{"Warna": "Hijau Army", "Tipe": "Dome", "Pole": "Fiberglass 8.5mm"}'
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm border border-stone-200 rounded-lg bg-stone-50 focus:border-emerald-500 focus:bg-white outline-none transition-colors resize-none font-mono"
                />
              </div>
            </div>

            {/* ── Media ── */}
            <div>
              <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-1 h-3.5 rounded-full bg-emerald-600" />
                Media
              </h3>
              <div className="space-y-4">
                {/* Gambar Utama */}
                <div className="space-y-1.5">
                  <FieldLabel>Gambar Utama</FieldLabel>
                  {/* Tab switcher */}
                  <div className="flex gap-1 mb-2">
                    <button
                      type="button"
                      onClick={() => setImageTab('url')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        imageTab === 'url'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                      }`}
                    >
                      <Link className="w-3 h-3" /> URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageTab('file')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        imageTab === 'file'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                      }`}
                    >
                      <Upload className="w-3 h-3" /> Upload File
                    </button>
                  </div>

                  {imageTab === 'url' ? (
                    <Input
                      type="url"
                      value={form.image_url}
                      onChange={(e) => set('image_url', e.target.value)}
                      placeholder="https://..."
                      className="h-10 text-sm rounded-lg border-stone-200 bg-stone-50 focus:border-emerald-500 focus:bg-white"
                    />
                  ) : (
                    <div className="flex items-center gap-3">
                      <label className="flex-1 flex items-center justify-center gap-2 h-10 px-3 rounded-lg border-2 border-dashed border-stone-300 bg-stone-50 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors">
                        <Upload className="w-4 h-4 text-stone-400" />
                        <span className="text-sm text-stone-500">
                          {uploading ? 'Mengupload...' : 'Pilih File'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFile}
                          disabled={uploading}
                          className="hidden"
                        />
                      </label>
                      {uploading && <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />}
                    </div>
                  )}

                  {form.image_url && (
                    <div className="relative rounded-lg overflow-hidden border border-stone-200 h-28 mt-2 group">
                      <OptimizedImage src={form.image_url} alt="Preview" className="w-full h-full object-cover" width={200} height={112} />
                      <button
                        type="button"
                        onClick={() => set('image_url', '')}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Galeri Gambar */}
                <div className="space-y-1.5">
                  <FieldLabel>Galeri Gambar</FieldLabel>
                  {/* Tab switcher */}
                  <div className="flex gap-1 mb-2">
                    <button
                      type="button"
                      onClick={() => setGalleryTab('url')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        galleryTab === 'url'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                      }`}
                    >
                      <Link className="w-3 h-3" /> URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setGalleryTab('file')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        galleryTab === 'file'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                      }`}
                    >
                      <Upload className="w-3 h-3" /> Upload File
                    </button>
                  </div>

                  {galleryTab === 'url' ? (
                    <div className="flex gap-2">
                      <Input
                        type="url"
                        value={galleryInput}
                        onChange={(e) => setGalleryInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGalleryUrl())}
                        placeholder="https://..."
                        className="h-10 text-sm rounded-lg border-stone-200 bg-stone-50 focus:border-emerald-500 focus:bg-white flex-1"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={addGalleryUrl}
                        disabled={!galleryInput.trim()}
                        className="h-10 px-3 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 shadow-none"
                      >
                        <ImagePlus className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <label className="flex-1 flex items-center justify-center gap-2 h-10 px-3 rounded-lg border-2 border-dashed border-stone-300 bg-stone-50 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors">
                        <ImagePlus className="w-4 h-4 text-stone-400" />
                        <span className="text-sm text-stone-500">
                          {uploading ? 'Mengupload...' : 'Tambah Gambar'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleGalleryFile}
                          disabled={uploading}
                          className="hidden"
                        />
                      </label>
                      {uploading && <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />}
                    </div>
                  )}

                  {form.gallery_urls.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {form.gallery_urls.map((url, idx) => (
                        <div key={idx} className="relative group rounded-lg overflow-hidden border border-stone-200 w-16 h-16">
                          <OptimizedImage src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" width={64} height={64} />
                          <button
                            type="button"
                            onClick={() => removeGalleryUrl(idx)}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Promo (Collapsible, Optional) ── */}
            <div>
              <button
                type="button"
                onClick={() => setShowPromo(!showPromo)}
                className="flex items-center justify-between w-full text-left"
              >
                <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1 h-3.5 rounded-full bg-orange-400" />
                  Promo & Diskon <span className="text-[9px] text-stone-300 font-normal normal-case">(opsional)</span>
                </h3>
                <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${showPromo ? 'rotate-180' : ''}`} />
              </button>
              {showPromo && (
                <div className="mt-3 space-y-3 p-4 rounded-xl bg-orange-50/50 border border-orange-100">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_promo"
                      checked={form.is_promo}
                      onChange={(e) => set('is_promo', e.target.checked)}
                      className="rounded border-stone-300 text-emerald-700 focus:ring-emerald-500"
                    />
                    <Label htmlFor="is_promo" className="text-sm text-stone-700 font-medium cursor-pointer">
                      Aktifkan Promo
                    </Label>
                  </div>
                  {form.is_promo && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <FieldLabel>Harga Promo/Malam (Rp)</FieldLabel>
                        <Input
                          type="number" min="0"
                          value={form.promo_price_per_night}
                          onChange={(e) => set('promo_price_per_night', e.target.value)}
                          placeholder="60000"
                          className="h-10 text-sm rounded-lg border-stone-200 bg-white focus:border-emerald-500 focus:bg-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <FieldLabel>Diskon (%)</FieldLabel>
                        <Input
                          type="number" min="0" max="100" step="0.1"
                          value={form.discount_percentage}
                          onChange={(e) => set('discount_percentage', e.target.value)}
                          placeholder="20"
                          className="h-10 text-sm rounded-lg border-stone-200 bg-white focus:border-emerald-500 focus:bg-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <FieldLabel>Mulai Promo</FieldLabel>
                        <Input
                          type="datetime-local"
                          value={form.promo_start_date}
                          onChange={(e) => set('promo_start_date', e.target.value)}
                          className="h-10 text-sm rounded-lg border-stone-200 bg-white focus:border-emerald-500 focus:bg-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <FieldLabel>Selesai Promo</FieldLabel>
                        <Input
                          type="datetime-local"
                          value={form.promo_end_date}
                          onChange={(e) => set('promo_end_date', e.target.value)}
                          className="h-10 text-sm rounded-lg border-stone-200 bg-white focus:border-emerald-500 focus:bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
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

function EquipmentCard({
  item, onEdit, onDelete,
}: { item: Equipment; onEdit: () => void; onDelete: () => void }) {
  const stock = stockInfo(item.stock_quantity)

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
        {item.is_promo && (
          <span className="absolute top-2.5 right-2.5 text-[10px] bg-orange-500 text-white px-2 py-0.5 rounded-full font-bold">
            PROMO
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

        <div className="space-y-2 mb-3 mt-auto">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-stone-400">Harga/hari</span>
            <span className="text-xs font-semibold text-emerald-800">{formatCurrency(item.price_per_day)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-stone-400">Harga/malam</span>
            <span className="text-xs font-semibold text-emerald-800">{formatCurrency(item.price_per_night)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-stone-400">Stok</span>
            <Badge className={`${stock.cls} text-[10px] font-medium shadow-none`}>{stock.label}</Badge>
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
      </div>
    </Card>
  )
}

export default function EquipmentManagement() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<Equipment | null>(null)

  const fetchEquipment = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/equipment')
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setEquipment(json.data ?? [])
    } catch (err: any) {
      toast.error(err.message ?? 'Gagal memuat data produk')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/equipment?type=categories')
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setCategories(json.data ?? [])
    } catch {
      setCategories([])
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchEquipment(), fetchCategories()])
  }, [fetchEquipment, fetchCategories])

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
        category_id: form.category_id || null,
        brand: form.brand.trim() || null,
        description: form.description.trim() || null,
        detailed_description: form.detailed_description.trim() || null,
        price_per_day: parseFloat(form.price_per_day) || 0,
        price_per_night: parseFloat(form.price_per_night) || 0,
        stock_quantity: parseInt(form.stock_quantity) || 0,
        is_available: form.is_available,
        is_active: form.is_active,
        activities: form.activities,
        image_url: form.image_url.trim() || null,
        gallery_urls: form.gallery_urls.length > 0 ? form.gallery_urls : [],
        capacity: form.capacity.trim() || null,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        dimensions: form.dimensions.trim() || null,
        material: form.material.trim() || null,
        weather_rating: form.weather_rating.trim() || null,
        specifications: specs,
        is_promo: form.is_promo,
        discount_percentage: form.discount_percentage ? parseFloat(form.discount_percentage) : null,
        promo_price_per_night: form.promo_price_per_night ? parseFloat(form.promo_price_per_night) : null,
        promo_start_date: form.promo_start_date ? new Date(form.promo_start_date).toISOString() : null,
        promo_end_date: form.promo_end_date ? new Date(form.promo_end_date).toISOString() : null,
      }

      let res: Response
      if (editingItem) {
        res = await fetch('/api/admin/equipment', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingItem.id, ...payload }),
        })
      } else {
        res = await fetch('/api/admin/equipment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      invalidateFeaturedProducts()
      toast.success(editingItem ? 'Produk berhasil diperbarui!' : 'Produk berhasil ditambahkan!')

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
      const res = await fetch(`/api/admin/equipment?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      invalidateFeaturedProducts()
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

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]))

  const filtered = equipment.filter((item) => {
    const catName = item.category_id ? catMap[item.category_id] ?? item.category ?? '' : item.category ?? ''
    const matchSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      catName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchCat = !categoryFilter || catName === categoryFilter
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
            Manajemen Produk
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
                placeholder="Cari produk atau kategori..."
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
              {categories.map((c) => <option key={c.id}>{c.name}</option>)}
            </select>

            <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-md font-medium whitespace-nowrap">
              {filtered.length} produk
            </span>
          </div>
        </Card>

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

      <EquipmentModal
        open={showModal}
        onClose={closeModal}
        onSubmit={handleSubmit}
        editingItem={editingItem}
        loading={saving}
        categories={categories}
      />
    </div>
  )
}
