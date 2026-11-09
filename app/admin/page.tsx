"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from "@/lib/supabaseClient"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  Clock,
  CheckCircle,
  Package,
  RefreshCw,
  Users,
  Calendar,
  ArrowRight,
  CreditCard,
} from "lucide-react"
import Link from "next/link"

interface ActiveBooking {
  id: string
  status: string
  start_date: string
  end_date: string
  total_cost: number
  created_at: string
  user_id: string | null
  payment_status?: string | null
  payment_method?: string | null
  users: { id: string; full_name: string | null; email: string | null } | null
}

interface BookingItem {
  id: string
  status: string
  total_cost: number
  created_at: string
  user_id: string | null
}

interface VerifyItem extends BookingItem {
  payment_status?: string | null
  payment_method?: string | null
  payment_proof_uploaded_at?: string | null
  users: { id: string; full_name: string | null; email: string | null } | null
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Menunggu',
  confirmed: 'Terkonfirmasi',
  picked_up: 'Dipinjam',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  picked_up: 'bg-purple-50 text-purple-700 border-purple-200',
}

const PAY_LABELS: Record<string, string> = {
  pending: 'Menunggu Verifikasi',
  paid: 'Lunas',
  failed: 'Ditolak',
  cancelled: 'Dibatalkan',
  expired: 'Kedaluwarsa',
  refunded: 'Dikembalikan',
}

const payColor = (s?: string | null) => {
  switch (s) {
    case 'paid': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'failed':
    case 'cancelled':
    case 'expired': return 'bg-red-50 text-red-700 border-red-200'
    default: return 'bg-stone-50 text-stone-500 border-stone-200'
  }
}

const FORMAT_DATE = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

const FORMAT_RP = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0)

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState<BookingItem[]>([])
  const [pickedUp, setPickedUp] = useState<BookingItem[]>([])
  const [confirmed, setConfirmed] = useState<BookingItem[]>([])
  const [activeBookings, setActiveBookings] = useState<ActiveBooking[]>([])
  const [needsVerification, setNeedsVerification] = useState<VerifyItem[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadDashboardData = async () => {
    setLoadError(null)
    try {
      const res = await fetch('/api/admin/dashboard')
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || `HTTP ${res.status}`)
      }
      const result = await res.json()
      if (!result.success) throw new Error(result.error)

      setPending(result.data.pending || [])
      setPickedUp(result.data.pickedUp || [])
      setConfirmed(result.data.confirmed || [])
      setActiveBookings(result.data.activeBookings || [])
      setNeedsVerification(result.data.needsVerification || [])
    } catch (err: any) {
      const msg = err?.message || 'Gagal memuat data dashboard'
      console.error('Error loading dashboard data:', msg)
      setLoadError(msg)
    }
  }

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.replace("/admin/login")
        return
      }

      // Verify admin status via API (client-side RLS blocks direct users query)
      try {
        const res = await fetch('/api/admin/dashboard')
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body?.error || `HTTP ${res.status}`)
        }
        // Dashboard API returned OK — user is authenticated and has access
        await loadDashboardData()
      } catch (apiErr: any) {
        // If the dashboard API fails due to auth, sign out
        if (apiErr?.message?.includes('permission') || apiErr?.message?.includes('denied')) {
          await fetch("/api/auth/admin-trust", { method: "DELETE" }).catch(() => null)
          await supabase.auth.signOut()
          router.replace("/admin/login")
          return
        }
        // Other errors — still try to load dashboard
        await loadDashboardData()
      }
    } catch (error) {
      console.error('Auth check error:', error)
      router.replace("/admin/login")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [router])

  // Muat ulang data saat halaman kembali mendapat fokus (mis. setelah
  // menghapus/ubah booking di halaman lain lalu kembali ke dashboard).
  useEffect(() => {
    const refreshData = () => {
      if (!loading) loadDashboardData()
    }
    window.addEventListener("focus", refreshData)
    document.addEventListener("visibilitychange", refreshData)
    window.addEventListener("pageshow", refreshData)
    window.addEventListener("popstate", refreshData)
    return () => {
      window.removeEventListener("focus", refreshData)
      document.removeEventListener("visibilitychange", refreshData)
      window.removeEventListener("pageshow", refreshData)
      window.removeEventListener("popstate", refreshData)
    }
  }, [loading])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadDashboardData()
    setRefreshing(false)
  }

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // Tabel dashboard hanya ringkasan: 5 booking aktif terbaru.
  // Selengkapnya lewat halaman /admin/bookings.
  const recentActiveBookings = activeBookings.slice(0, 5)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1EFE8] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
      </div>
    )
  }

  const statCards = [
    {
      href: "/admin/bookings",
      count: needsVerification.length,
      label: "Perlu Verifikasi",
      icon: CreditCard,
      box: "bg-amber-50 group-hover:bg-amber-100",
      iconColor: "text-amber-600",
      hoverBorder: "hover:border-amber-300",
    },
    {
      href: "/admin/bookings",
      count: pending.length,
      label: "Perlu Diproses",
      icon: Clock,
      box: "bg-orange-50 group-hover:bg-orange-100",
      iconColor: "text-orange-600",
      hoverBorder: "hover:border-orange-300",
    },
    {
      href: "/admin/bookings",
      count: confirmed.length,
      label: "Dikonfirmasi",
      icon: CheckCircle,
      box: "bg-blue-50 group-hover:bg-blue-100",
      iconColor: "text-blue-600",
      hoverBorder: "hover:border-blue-300",
    },
    {
      href: "/admin/bookings",
      count: pickedUp.length,
      label: "Sedang Dipinjam",
      icon: Package,
      box: "bg-purple-50 group-hover:bg-purple-100",
      iconColor: "text-purple-600",
      hoverBorder: "hover:border-purple-300",
    },
  ]

  return (
    <div className="min-h-screen bg-[#F1EFE8] font-body">
      {loadError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-50 border border-red-200 text-red-700 px-5 py-3 rounded-xl shadow-lg text-sm flex items-center gap-3 max-w-xl">
          <span>⚠️ Gagal memuat data: {loadError}</span>
          <button
            onClick={handleRefresh}
            className="ml-auto shrink-0 text-xs font-semibold text-red-600 hover:text-red-800 underline"
          >
            Coba Lagi
          </button>
        </div>
      )}
      <main className="px-4 sm:px-6 py-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-stone-900" style={{ fontFamily: "'Fraunces', serif" }}>
              Dashboard
            </h1>
            <p className="text-sm text-stone-500 mt-1">{today}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-8 px-3 text-xs text-stone-500 hover:text-stone-800 rounded-lg gap-1.5 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ href, count, label, icon: Icon, box, iconColor, hoverBorder }) => (
            <Link key={label} href={href} className="block group">
              <Card className={`bg-white border border-stone-200 rounded-xl p-4 sm:p-5 shadow-none hover:shadow-md ${hoverBorder} transition-all duration-200`}>
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl ${box} flex items-center justify-center transition-colors shrink-0`}>
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl sm:text-3xl font-bold text-stone-900">{count}</p>
                    <p className="text-xs sm:text-sm text-stone-500 truncate">{label}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Antrean Verifikasi Pembayaran */}
        <Card className="bg-white border border-amber-200 rounded-xl shadow-none overflow-hidden">
          <div className="px-5 py-4 border-b border-amber-100 bg-amber-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-semibold text-stone-900" style={{ fontFamily: "'Fraunces', serif" }}>
                Menunggu Verifikasi Pembayaran
              </h2>
              {needsVerification.length > 0 && (
                <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px]">
                  {needsVerification.length}
                </Badge>
              )}
            </div>
            <Link href="/admin/bookings">
              <Button variant="ghost" size="sm" className="h-7 text-xs text-stone-500 hover:text-emerald-700 gap-1">
                Semua Booking <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
          {needsVerification.length > 0 ? (
            <div className="divide-y divide-stone-100">
              {needsVerification.map((b) => (
                <Link key={b.id} href={`/admin/bookings/${b.id}`} className="block hover:bg-amber-50/40 transition-colors">
                  <div className="px-5 py-3.5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-amber-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-900 truncate">
                        {b.users?.full_name || b.users?.email || 'Tanpa Akun'}
                      </p>
                      <p className="text-[11px] text-stone-400">
                        #{b.id.slice(0, 8)} · {b.payment_method || 'QRIS'} ·{" "}
                        {b.payment_proof_uploaded_at ? `bukti ${FORMAT_DATE(b.payment_proof_uploaded_at)}` : FORMAT_DATE(b.created_at)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-stone-900">{FORMAT_RP(b.total_cost)}</p>
                      <Badge className={`${payColor(b.payment_status)} text-[10px] mt-1`}>
                        {PAY_LABELS[b.payment_status || ''] || b.payment_status || '-'}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-5 py-8 text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-300" />
              <p className="text-sm font-medium text-stone-500">Semua pembayaran sudah diverifikasi</p>
            </div>
          )}
        </Card>

        {/* Active Bookings List */}
        <Card className="bg-white border border-stone-200 rounded-xl shadow-none overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-stone-600" />
              <h2 className="text-base font-semibold text-stone-900" style={{ fontFamily: "'Fraunces', serif" }}>
                Booking Aktif
              </h2>
            </div>
            <Link href="/admin/bookings">
              <Button variant="ghost" size="sm" className="h-7 text-xs text-stone-500 hover:text-emerald-700 gap-1">
                Lihat Semua <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">User</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">Status</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">Bayar</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">Tanggal Sewa</th>
                  <th className="text-right py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">Total</th>
                  <th className="text-right py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {recentActiveBookings.length > 0 ? (
                  recentActiveBookings.map((b) => (
                    <tr key={b.id} className="border-b border-stone-100 hover:bg-stone-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                            <Users className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-stone-900">
                              {b.users?.full_name || b.users?.email || 'Tanpa Akun'}
                            </p>
                            {b.users?.email && (
                              <p className="text-[10px] text-stone-400">{b.users.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={`${STATUS_COLORS[b.status] || ''} text-[10px] font-medium shadow-none`}>
                          {STATUS_LABELS[b.status] || b.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={`${payColor(b.payment_status)} text-[10px] font-medium shadow-none`}>
                          {PAY_LABELS[b.payment_status || ''] || b.payment_status || '-'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-stone-700 whitespace-nowrap">
                        {b.start_date ? FORMAT_DATE(b.start_date) : '—'}
                        <span className="text-stone-400 text-xs"> → {b.end_date ? FORMAT_DATE(b.end_date) : '—'}</span>
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-semibold text-stone-800 whitespace-nowrap">
                        {FORMAT_RP(b.total_cost)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/admin/bookings/${b.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] text-stone-500 hover:text-emerald-700 hover:bg-emerald-50 gap-1">
                            Detail <ArrowRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-stone-400">
                      <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm font-medium text-stone-500">Belum ada booking aktif</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  )
}
