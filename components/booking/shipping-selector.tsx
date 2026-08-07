'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Truck, Store, MapPin, Search, Package } from 'lucide-react'
import { COURIER_OPTIONS, type ShippingOption, type RajaOngkirDestination } from '@/lib/rajaongkir'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<RajaOngkirDestination[]>([])
  const [selectedDestination, setSelectedDestination] = useState<RajaOngkirDestination | null>(null)
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  // Search destinations
  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const res = await fetch(`/api/shipping/destination?q=${encodeURIComponent(query)}`)
      const result = await res.json()
      if (result.success) {
        setSearchResults(result.data || [])
      }
    } catch {
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    const timeout = setTimeout(() => {
      handleSearch(searchQuery)
    }, 500)

    setSearchTimeout(timeout)

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [searchQuery])

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
      onShippingSelect({ method: 'pickup' })
    } else if (selectedShipping && selectedDestination) {
      onShippingSelect({
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
              <p className="text-sm font-bold text-slate-800">Ambil di Cabang</p>
              <p className="text-[10px] text-stone-500">Ambil langsung di lokasi</p>
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
              <p className="text-sm font-bold text-slate-800">Kirim ke Alamat</p>
              <p className="text-[10px] text-stone-500">via ekspedisi (JNE, J&T, dll)</p>
            </div>
          </div>
        </button>
      </div>

      {/* Shipping Form */}
      {method === 'shipping' && (
        <div className="space-y-4 p-4 rounded-xl border border-stone-200 bg-stone-50">
          {/* Destination Search */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800">
              Cari Tujuan Pengiriman
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setSelectedDestination(null)
                  setShippingOptions([])
                  setSelectedShipping(null)
                }}
                placeholder="Contoh: Jakarta, Surabaya, Bandung..."
                className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-stone-400" />
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && !selectedDestination && (
              <div className="max-h-48 overflow-y-auto border border-stone-200 rounded-xl bg-white">
                {searchResults.map((dest) => (
                  <button
                    key={dest.id}
                    type="button"
                    onClick={() => {
                      setSelectedDestination(dest)
                      setSearchQuery(dest.label)
                      setSearchResults([])
                    }}
                    className="w-full p-3 text-left hover:bg-emerald-50 transition-colors border-b border-stone-100 last:border-0"
                  >
                    <p className="text-sm font-medium text-slate-800">{dest.label}</p>
                    <p className="text-[10px] text-stone-500">
                      {dest.city_name}, {dest.province_name}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {/* Selected Destination */}
            {selectedDestination && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-emerald-800">{selectedDestination.label}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDestination(null)
                    setSearchQuery('')
                    setShippingOptions([])
                    setSelectedShipping(null)
                  }}
                  className="text-xs text-emerald-600 hover:text-emerald-800"
                >
                  Ganti
                </button>
              </div>
            )}
          </div>

          {/* Shipping Options */}
          {selectedDestination && (
            <div className="space-y-2">
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
          )}

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
