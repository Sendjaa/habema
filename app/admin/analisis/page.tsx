'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { DollarSign } from 'lucide-react'

interface RevenueItem {
  date: string
  revenue: number
}

interface MonthlyRevenue {
  month: string
  revenue: number
}

interface CategoryRevenue {
  category_name: string
  revenue: number
}

const FORMAT_CURRENCY = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)

const STATUS_CONFIG = [
  { key: 'returned', label: 'Selesai', barColor: 'bg-green-500', cardBg: 'bg-green-50 border-green-200 text-green-800' },
  { key: 'picked_up', label: 'Dipinjam', barColor: 'bg-purple-500', cardBg: 'bg-purple-50 border-purple-200 text-purple-800' },
  { key: 'confirmed', label: 'Terkonfirmasi', barColor: 'bg-blue-500', cardBg: 'bg-blue-50 border-blue-200 text-blue-800' },
  { key: 'pending', label: 'Menunggu', barColor: 'bg-amber-500', cardBg: 'bg-amber-50 border-amber-200 text-amber-800' },
  { key: 'cancelled', label: 'Dibatalkan', barColor: 'bg-red-500', cardBg: 'bg-red-50 border-red-200 text-red-800' },
]

export default function AnalisisPage() {
  const [loading, setLoading] = useState(true)
  const [revenueByStatus, setRevenueByStatus] = useState<Record<string, number>>({})
  const [dailyRevenue, setDailyRevenue] = useState<RevenueItem[]>([])
  const [monthlyRevenueTrend, setMonthlyRevenueTrend] = useState<MonthlyRevenue[]>([])
  const [revenueByCategory, setRevenueByCategory] = useState<CategoryRevenue[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/admin/stats')
        if (!res.ok) throw new Error('Failed to fetch stats')
        const result = await res.json()
        if (!result.success) throw new Error(result.error)

        setRevenueByStatus(result.data.revenueByStatus || {})
        setDailyRevenue(result.data.dailyRevenue || [])
        setMonthlyRevenueTrend(result.data.monthlyRevenueTrend || [])
        setRevenueByCategory(result.data.revenueByCategory || [])
      } catch (err) {
        console.error('Failed to load analisis data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

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
        <Card className="bg-white border border-stone-200 rounded-xl p-5 shadow-none">
          <div className="flex items-center gap-2 mb-5">
            <DollarSign className="w-5 h-5 text-emerald-700" />
            <h3 className="text-lg font-semibold text-stone-900" style={{ fontFamily: "'Fraunces', serif" }}>
              Detail Pendapatan
            </h3>
          </div>

          {/* Revenue by Status */}
          <div className="mb-6">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-3">Berdasarkan Status</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {STATUS_CONFIG.map(({ key, label, cardBg }) => {
                const value = revenueByStatus[key] || 0
                const maxVal = Math.max(...Object.values(revenueByStatus), 1)
                const pct = maxVal > 0 ? (value / maxVal) * 100 : 0
                const barColor = key === 'returned' ? 'bg-green-500' : key === 'picked_up' ? 'bg-purple-500' : key === 'confirmed' ? 'bg-blue-500' : key === 'pending' ? 'bg-amber-500' : 'bg-red-500'
                return (
                  <div key={key} className={`rounded-lg border p-3 ${cardBg}`}>
                    <p className="text-[10px] font-medium opacity-80 mb-1">{label}</p>
                    <p className="text-sm font-bold mb-1.5">{FORMAT_CURRENCY(value)}</p>
                    <div className="h-1.5 rounded-full bg-white/60 overflow-hidden">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Daily & Monthly Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Daily Revenue */}
            <div>
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-3">Pendapatan Harian (Bulan Ini)</p>
              {dailyRevenue.length > 0 ? (
                <div className="space-y-1.5">
                  {(() => {
                    const maxRev = Math.max(...dailyRevenue.map(d => d.revenue), 1)
                    return dailyRevenue.map((d) => (
                      <div key={d.date} className="flex items-center gap-2">
                        <span className="text-[10px] text-stone-500 w-20 shrink-0">
                          {new Date(d.date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                        <div className="flex-1 h-5 bg-stone-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${(d.revenue / maxRev) * 100}%` }} />
                        </div>
                        <span className="text-[10px] text-stone-600 w-24 text-right font-medium">{FORMAT_CURRENCY(d.revenue)}</span>
                      </div>
                    ))
                  })()}
                </div>
              ) : (
                <p className="text-sm text-stone-400 py-4 text-center">Belum ada data pendapatan bulan ini</p>
              )}
            </div>

            {/* Monthly Trend */}
            <div>
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-3">Tren Pendapatan (6 Bulan)</p>
              {monthlyRevenueTrend.length > 0 ? (
                <div className="space-y-1.5">
                  {(() => {
                    const maxRev = Math.max(...monthlyRevenueTrend.map(m => m.revenue), 1)
                    return monthlyRevenueTrend.map((m) => (
                      <div key={m.month} className="flex items-center gap-2">
                        <span className="text-[10px] text-stone-500 w-16 shrink-0">
                          {new Date(m.month + '-01T00:00:00').toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })}
                        </span>
                        <div className="flex-1 h-5 bg-stone-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${(m.revenue / maxRev) * 100}%` }} />
                        </div>
                        <span className="text-[10px] text-stone-600 w-24 text-right font-medium">{FORMAT_CURRENCY(m.revenue)}</span>
                      </div>
                    ))
                  })()}
                </div>
              ) : (
                <p className="text-sm text-stone-400 py-4 text-center">Belum ada data tren pendapatan</p>
              )}
            </div>
          </div>

          {/* Revenue by Category */}
          <div>
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-3">Pendapatan per Kategori</p>
            {revenueByCategory.length > 0 ? (
              <div className="space-y-1.5">
                {(() => {
                  const maxCatRev = Math.max(...revenueByCategory.map(c => c.revenue), 1)
                  return revenueByCategory.map((c) => (
                    <div key={c.category_name} className="flex items-center gap-2">
                      <span className="text-[10px] text-stone-500 w-28 shrink-0 truncate">{c.category_name}</span>
                      <div className="flex-1 h-5 bg-stone-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full transition-all duration-300" style={{ width: `${(c.revenue / maxCatRev) * 100}%` }} />
                      </div>
                      <span className="text-[10px] text-stone-600 w-24 text-right font-medium">{FORMAT_CURRENCY(c.revenue)}</span>
                    </div>
                  ))
                })()}
              </div>
            ) : (
              <p className="text-sm text-stone-400 py-4 text-center">Belum ada data pendapatan per kategori</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
