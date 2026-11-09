'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Loader2, Truck, Store, Package, Search } from 'lucide-react'
import { COURIER_OPTIONS, searchDestination, type ShippingOption, type RajaOngkirDestination } from '@/lib/rajaongkir'

interface ShippingSelectorProps {
  originId?: number
  weight?: number
  onShippingSelect: (data: {
    method: 'pickup' | 'shipping'
    courierCode?: string
    courierService?: string
    shippingCost?: number
    destinationId?: number
    destinationLabel?: string
  }) => void
  className?: string
}

export function ShippingSelector({
  originId = 31555, // Default: Bandung (Cihanjuang)
  weight = 1000,
  onShippingSelect,
  className = '',
}: ShippingSelectorProps) {
  const [method, setMethod] = useState<'pickup' | 'shipping'>('pickup')
  const [selectedDestination, setSelectedDestination] = useState<RajaOngkirDestination | null>(null)
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const onShippingSelectRef = useRef(onShippingSelect)
  onShippingSelectRef.current = onShippingSelect

  // Destination search (Raja Ongkir)
  const [destinationQuery, setDestinationQuery] = useState('')
  const [destinations, setDestinations] = useState<RajaOngkirDestination[]>([])
  const [destinationsOpen, setDestinationsOpen] = useState(false)
  const [searchDestinationsError, setSearchDestinationsError] = useState<string | null>(null)

  const searchDestinations = useCallback(async (keyword: string) => {
    if (!keyword || keyword.length < 2) {
      setDestinations([])
      setSearchDestinationsError(null)
      return
    }
    setSearchDestinationsError(null)
    try {
      const results = await searchDestination(keyword)
      setDestinations(results)
    } catch (error: any) {
      setDestinations([])
      setSearchDestinationsError(error.message || 'Gagal mencari tujuan')
    }
  }, [])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (destinationQuery.length >= 2) {
      timer = setTimeout(() => searchDestinations(destinationQuery), 300)
    } else {
      setDestinations([])
      setSearchDestinationsError(null)
    }
    return () => clearTimeout(timer)
  }, [destinationQuery, searchDestinations])

  const selectDestination = (dest: RajaOngkirDestination) => {
    setSelectedDestination(dest)
    setDestinationQuery(dest.label)
    setDestinations([])
    setDestinationsOpen(false)
  }

  // Calculate shipping cost when destination is selected
  useEffect(() => {
    if (!selectedDestination || method !== 'shipping') return

    const calculateCost = async () => {
      setIsCalculating(true)
      try {
        const res = await fetch('/api/shipping/cost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            originId,
            destinationId: selectedDestination.id,
            weight,
            couriers: COURIER_OPTIONS.map((c) => c.code),
          }),
        })
        const result = await res.json()
        if (result.success) {
          setShippingOptions(result.data || [])
        }
      } catch {
        setShippingOptions([])
      } finally {
        setIsCalculating(false)
      }
    }

    calculateCost()
  }, [selectedDestination, method, originId, weight])

  // Notify parent on selection change
  useEffect(() => {
    if (method === 'pickup') {
      onShippingSelectRef.current({ method: 'pickup' })
    } else if (selectedShipping && selectedDestination) {
      onShippingSelectRef.current({
        method: 'shipping',
        courierCode: selectedShipping.courierCode,
        courierService: selectedShipping.service,
        shippingCost: selectedShipping.cost,
        destinationId: selectedDestination.id,
        destinationLabel: selectedDestination.label,
      })
    }
  }, [method, selectedShipping, selectedDestination])

  const formatCost = (cost: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(cost)

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Method Toggle */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setMethod('pickup')}
          className={`p-4 rounded-xl border-2 text-left transition-all ${
            method === 'pickup'
              ? 'border-emerald-600 bg-emerald-50/60'
              : 'border-stone-200 bg-white hover:border-stone-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <Store className={`w-5 h-5 ${method === 'pickup' ? 'text-emerald-600' : 'text-stone-400'}`} />
            <div>
              <p className="text-sm font-bold text-slate-800">Ambil ke Store</p>
              <p className="text-[10px] text-stone-500">Ambil langsung di store</p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setMethod('shipping')}
          className={`p-4 rounded-xl border-2 text-left transition-all ${
            method === 'shipping'
              ? 'border-emerald-600 bg-emerald-50/60'
              : 'border-stone-200 bg-white hover:border-stone-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <Truck className={`w-5 h-5 ${method === 'shipping' ? 'text-emerald-600' : 'text-stone-400'}`} />
            <div>
              <p className="text-sm font-bold text-slate-800">Pilih Metode Pengiriman</p>
              <p className="text-[10px] text-stone-500">via ekspedisi (JNE, J&T, dll)</p>
            </div>
          </div>
        </button>
      </div>

      {/* Shipping Form */}
      {method === 'shipping' && (
        <div className="space-y-4 p-4 rounded-xl border border-stone-200 bg-stone-50">
          {/* Shipping Options */}
          <div className="space-y-2">
            {/* Destination */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-800">Tujuan Pengiriman</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={destinationQuery}
                  onChange={(e) => setDestinationQuery(e.target.value)}
                  onFocus={() => setDestinationsOpen(true)}
                  placeholder="Kota / kabupaten (mis. Bandung)"
                  className="w-full h-10 pl-9 pr-4 rounded-xl border border-stone-200 focus:border-[#1B4332] focus:ring-1 focus:ring-[#1B4332] text-sm outline-none"
                />
                {searchDestinationsError && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-red-600">{searchDestinationsError}</span>
                )}
              </div>
              {destinationsOpen && destinations.length > 0 && (
                <div className="absolute z-20 w-full max-h-48 overflow-y-auto rounded-xl border border-stone-200 bg-white shadow-sm mt-1">
                  {destinations.map((dest) => (
                    <button
                      key={dest.id}
                      type="button"
                      onClick={() => selectDestination(dest)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-emerald-50 transition-colors"
                    >
                      <div className="font-medium text-slate-800">{dest.label}</div>
                      <div className="text-[10px] text-stone-500">{dest.city_name}, {dest.province_name}</div>
                    </button>
                  ))}
                </div>
              )}
              {destinationsOpen && destinations.length === 0 && destinationQuery.length >= 2 && searchDestinationsError === null && (
                <div className="py-2 text-center text-xs text-stone-400">Tujuan tidak ditemukan</div>
              )}
              {selectedDestination && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50/60 rounded-xl px-3 py-2 border border-emerald-100">
                  <span className="font-semibold">Tujuan:</span> {selectedDestination.label}
                </div>
              )}
            </div>

            <label className="text-sm font-semibold text-slate-800">Pilih Ekspedisi</label>
              {isCalculating ? (
                <div className="flex items-center gap-2 py-4 text-stone-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs">Menghitung ongkir...</span>
                </div>
              ) : shippingOptions.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {shippingOptions.map((opt, idx) => (
                    <button
                      key={`${opt.courierCode}-${opt.service}-${idx}`}
                      type="button"
                      onClick={() => setSelectedShipping(opt)}
                      className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                        selectedShipping?.courierCode === opt.courierCode &&
                        selectedShipping?.service === opt.service
                          ? 'border-emerald-600 bg-emerald-50/60'
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Package className={`w-4 h-4 ${
                            selectedShipping?.courierCode === opt.courierCode ? 'text-emerald-600' : 'text-stone-400'
                          }`} />
                          <div>
                            <p className="text-sm font-bold text-slate-800">{opt.courierName}</p>
                            <p className="text-[10px] text-stone-500">{opt.service} — {opt.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-700">{formatCost(opt.cost)}</p>
                          <p className="text-[10px] text-stone-500">{opt.etd}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-stone-500">
                  Pilih tujuan untuk melihat opsi pengiriman
                </div>
              )}
            </div>

          {/* Weight Info */}
          <div className="flex items-center gap-2 text-[10px] text-stone-400">
            <Package className="w-3 h-3" />
            <span>Estimasi berat: {weight} gram</span>
          </div>
        </div>
      )}
    </div>
  )
}
