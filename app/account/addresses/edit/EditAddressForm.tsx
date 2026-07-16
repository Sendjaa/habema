"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"
import { ChevronLeft, Loader2, MapPin } from "lucide-react"
import { toast } from "sonner"

interface Address {
  id: string
  user_id: string
  label: string
  recipient_name: string
  phone: string
  address: string
  province: string
  city: string
  postal_code: string
  is_default: boolean
}

export function EditAddressForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const [address, setAddress] = useState<Address | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchAddress = async () => {
      if (!id) return
      try {
        const { data, error } = await supabase
          .from("addresses")
          .select("*")
          .eq("id", id)
          .single()

        if (error) throw error
        setAddress(data)
      } catch (err) {
        toast.error("Gagal memuat alamat")
        router.push("/account/addresses")
      } finally {
        setLoading(false)
      }
    }

    fetchAddress()
  }, [id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address) return
    
    setSaving(true)
    try {
      const { error } = await supabase
        .from("addresses")
        .update({
          label: address.label,
          recipient_name: address.recipient_name,
          phone: address.phone,
          address: address.address,
          province: address.province,
          city: address.city,
          postal_code: address.postal_code,
        })
        .eq("id", address.id)

      if (error) throw error
      toast.success("Alamat berhasil diperbarui")
      router.push("/account/addresses")
    } catch (err) {
      toast.error("Gagal menyimpan alamat")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
          <p className="text-sm text-stone-500">Memuat alamat...</p>
        </div>
      </div>
    )
  }

  if (!address) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5] pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Link
              href="/account/addresses"
              className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Kembali
            </Link>
          </div>
          <h1 className="text-xl font-bold text-stone-900">Edit Alamat</h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Label Alamat</label>
              <input
                type="text"
                value={address.label}
                onChange={(e) => setAddress({...address, label: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Nama Penerima</label>
              <input
                type="text"
                value={address.recipient_name}
                onChange={(e) => setAddress({...address, recipient_name: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Nomor Telepon</label>
              <input
                type="tel"
                value={address.phone}
                onChange={(e) => setAddress({...address, phone: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Kode Pos</label>
              <input
                type="text"
                value={address.postal_code}
                onChange={(e) => setAddress({...address, postal_code: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-stone-700">Alamat Lengkap</label>
              <textarea
                value={address.address}
                onChange={(e) => setAddress({...address, address: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Provinsi</label>
              <input
                type="text"
                value={address.province}
                onChange={(e) => setAddress({...address, province: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Kota/Kabupaten</label>
              <input
                type="text"
                value={address.city}
                onChange={(e) => setAddress({...address, city: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}