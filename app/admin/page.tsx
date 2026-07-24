"use client"

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from "@/lib/supabaseClient"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  ArrowRight,
  Mountain,
  LogOut,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Activity,
  Bell,
  Tag,
  Percent,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

// Types
interface DashboardStats {
  totalBookings: number
  pendingBookings: number
  confirmedBookings: number
  totalRevenue: number
  monthlyRevenue: number
  totalUsers: number
  newUsersThisMonth: number
  totalEquipment: number
  lowStockItems: number
}

interface RecentActivity {
  id: string
  type: 'booking' | 'user' | 'equipment'
  message: string
  timestamp: string
  status?: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalUsers: 0,
    newUsersThisMonth: 0,
    totalEquipment: 0,
    lowStockItems: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    checkAuth()
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [router])

  // Helper functions
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount)

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })

  const formatRelativeTime = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Baru saja'
    if (diffMins < 60) return `${diffMins} menit lalu`
    if (diffHours < 24) return `${diffHours} jam lalu`
    if (diffDays < 7) return `${diffDays} hari lalu`
    return formatDate(dateString)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-3.5 h-3.5 text-amber-600" />
      case 'confirmed':
        return <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
      case 'picked_up':
        return <Package className="w-3.5 h-3.5 text-purple-600" />
      case 'returned':
        return <CheckCircle className="w-3.5 h-3.5 text-green-600" />
      case 'cancelled':
        return <XCircle className="w-3.5 h-3.5 text-red-600" />
      default:
        return <AlertCircle className="w-3.5 h-3.5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'confirmed':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'picked_up':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'returned':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.replace("/admin/login")
        return
      }

      let { data: profile, error } = await supabase
        .from('users')
        .select('is_vendor')
        .eq('id', session.user.id)
        .maybeSingle()

      // Jika record users belum ada, coba buat otomatis
      if (error?.code === 'PGRST116' || (!profile && !error)) {
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert([{
            id: session.user.id,
            email: session.user.email!,
            is_vendor: true,
            full_name: session.user.user_metadata?.full_name || 'Admin',
          }])
          .select('is_vendor')
          .single()

        if (!createError && newProfile) {
          profile = newProfile
          error = null
        }
      }

      if (error || !profile?.is_vendor) {
        console.error('Admin auth check failed:', error?.message)
        await supabase.auth.signOut()
        router.replace("/admin/login")
        return
      }

      // Authenticated, load dashboard data
      await loadDashboardData()

      // Subscribe ke realtime notifications — unsubscribe dulu jika sudah ada
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      channelRef.current = supabase
        .channel('admin-notifications')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications' },
          (payload) => {
            const notif = payload.new as any
            toast.info(notif.title || 'Notifikasi Baru', {
              description: notif.message || 'Ada aktivitas baru di dashboard',
              duration: 5000,
            })
            loadDashboardData()
          }
        )
        .subscribe()
    } catch (error) {
      console.error('Auth check error:', error)
      router.replace("/admin/login")
    } finally {
      setLoading(false)
    }
  }

  const loadDashboardData = async () => {
    try {
      const res = await fetch('/api/admin/stats')
      if (!res.ok) throw new Error('Failed to fetch stats')
      const result = await res.json()
      if (!result.success) throw new Error(result.error)

      const s = result.data
      setStats({
        totalBookings: s.totalBookings || 0,
        pendingBookings: s.pendingBookings || 0,
        confirmedBookings: s.confirmedBookings || 0,
        totalRevenue: s.totalRevenue || 0,
        monthlyRevenue: s.monthlyRevenue || 0,
        totalUsers: s.totalUsers || 0,
        newUsersThisMonth: s.newUsersThisMonth || 0,
        totalEquipment: s.totalEquipment || 0,
        lowStockItems: s.lowStockItems || 0,
      })

      // Build recent activity
      if (s.recentBookings?.length) {
        const activities: RecentActivity[] = s.recentBookings.map((b: any) => ({
          id: b.id,
          type: 'booking' as const,
          message: `Booking #${b.id.slice(0, 8)} - ${formatCurrency(b.total_cost || 0)}`,
          timestamp: b.created_at!,
          status: b.status || undefined,
        }))
        setRecentActivity(activities)
      }

      // Fetch unread notifications count
      try {
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('is_read', false)
        setUnreadCount(count || 0)
      } catch (e) {
        // ignore
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setStats({
        totalBookings: 0, pendingBookings: 0, confirmedBookings: 0,
        totalRevenue: 0, monthlyRevenue: 0, totalUsers: 0,
        newUsersThisMonth: 0, totalEquipment: 0, lowStockItems: 0,
      })
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadDashboardData()
    setRefreshing(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1EFE8] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F1EFE8] font-body">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center">
              <Mountain className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1
                className="text-base sm:text-lg text-stone-900 font-semibold tracking-tight"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Habema Admin
              </h1>
              <p className="text-[10px] text-stone-400 hidden sm:block">Dashboard Manajemen</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Bell className="w-5 h-5 text-stone-500" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-8 px-3 text-xs text-stone-500 hover:text-stone-800 rounded-lg gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="h-8 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 py-6 max-w-7xl mx-auto space-y-6">

        {/* Welcome Banner */}
        <Card className="bg-linear-to-br from-emerald-800 to-emerald-900 text-white p-5 sm:p-6 rounded-2xl border-0 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2
                className="text-xl sm:text-2xl font-semibold mb-1"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Selamat Datang! 👋
              </h2>
              <p className="text-emerald-100 text-sm">
                Kelola penyewaan perlengkapan outdoor Anda dari dashboard ini.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-100">
              <Activity className="w-4 h-4" />
              <span>Data real-time</span>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

          {/* Total Bookings */}
          <Card className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 shadow-none hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
              </div>
              <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] shadow-none">
                Total
              </Badge>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-stone-900 mb-1">
              {stats.totalBookings}
            </p>
            <p className="text-xs text-stone-500">Total Booking</p>
          </Card>

          {/* Revenue */}
          <Card className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 shadow-none hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] shadow-none">
                Bulan Ini
              </Badge>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-stone-900 mb-1">
              {formatCurrency(stats.monthlyRevenue)}
            </p>
            <p className="text-xs text-stone-500">Pendapatan Bulan Ini</p>
          </Card>


          {/* Users */}
          <Card className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 shadow-none hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex items-center gap-1 text-emerald-600">
                <TrendingUp className="w-3 h-3" />
                <span className="text-[10px] font-medium">+{stats.newUsersThisMonth}</span>
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-stone-900 mb-1">
              {stats.totalUsers}
            </p>
            <p className="text-xs text-stone-500">Total Pengguna</p>
          </Card>


          {/* Equipment */}
          <Card className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 shadow-none hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <Package className="w-5 h-5 text-amber-600" />
              </div>
              {stats.lowStockItems > 0 && (
                <Badge className="bg-red-50 text-red-700 border border-red-200 text-[10px] shadow-none">
                  {stats.lowStockItems} stok rendah
                </Badge>
              )}
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-stone-900 mb-1">
              {stats.totalEquipment}
            </p>
            <p className="text-xs text-stone-500">Total Produk</p>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Link href="/admin/bookings" className="group">
            <Card className="bg-white border border-stone-200 rounded-xl p-4 shadow-none hover:shadow-md hover:border-emerald-300 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                    <Calendar className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <h3 className="font-medium text-stone-900 text-sm">Manajemen Booking</h3>
                    <p className="text-xs text-stone-400">Kelola semua booking</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
              </div>
            </Card>
          </Link>

          <Link href="/admin/equipment" className="group">
            <Card className="bg-white border border-stone-200 rounded-xl p-4 shadow-none hover:shadow-md hover:border-emerald-300 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                    <Package className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="font-medium text-stone-900 text-sm">Manajemen Produk</h3>
                    <p className="text-xs text-stone-400">Kelola inventaris</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
              </div>
            </Card>
          </Link>

          <Link href="/admin/users" className="group">
            <Card className="bg-white border border-stone-200 rounded-xl p-4 shadow-none hover:shadow-md hover:border-emerald-300 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                    <Users className="w-5 h-5 text-purple-700" />
                  </div>
                  <div>
                    <h3 className="font-medium text-stone-900 text-sm">Manajemen User</h3>
                    <p className="text-xs text-stone-400">Kelola pelanggan</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
              </div>
            </Card>
          </Link>

          <Link href="/admin/discounts" className="group">
            <Card className="bg-white border border-stone-200 rounded-xl p-4 shadow-none hover:shadow-md hover:border-emerald-300 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                    <Tag className="w-5 h-5 text-rose-700" />
                  </div>
                  <div>
                    <h3 className="font-medium text-stone-900 text-sm">Manajemen Diskon</h3>
                    <p className="text-xs text-stone-400">Kelola promo & diskon</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-rose-600 group-hover:translate-x-1 transition-all" />
              </div>
            </Card>
          </Link>

          <Link href="/admin/products-promo" className="group">
            <Card className="bg-white border border-stone-200 rounded-xl p-4 shadow-none hover:shadow-md hover:border-orange-300 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                    <Percent className="w-5 h-5 text-orange-700" />
                  </div>
                  <div>
                    <h3 className="font-medium text-stone-900 text-sm">Promo Produk</h3>
                    <p className="text-xs text-stone-400">Kelola diskon per produk</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
              </div>
            </Card>
          </Link>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Booking Summary */}
          <Card className="bg-white border border-stone-200 rounded-xl p-5 shadow-none">
            <div className="flex items-center justify-between mb-4">
              <h3
                className="font-semibold text-stone-900"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Ringkasan Booking
              </h3>
              <Link href="/admin/bookings">
                <Button variant="ghost" size="sm" className="h-7 text-xs text-stone-500 hover:text-emerald-700">
                  Lihat Semua
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="space-y-3">
              {/* Pending */}
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span className="text-sm text-amber-800">Menunggu Konfirmasi</span>
                </div>
                <span className="font-semibold text-amber-900">{stats.pendingBookings}</span>
              </div>

              {/* Confirmed */}
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-800">Terkonfirmasi</span>
                </div>
                <span className="font-semibold text-blue-900">{stats.confirmedBookings}</span>
              </div>

              {/* Total Revenue */}
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm text-emerald-800">Total Pendapatan</span>
                </div>
                <span className="font-semibold text-emerald-900">{formatCurrency(stats.totalRevenue)}</span>
              </div>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-white border border-stone-200 rounded-xl p-5 shadow-none">
            <div className="flex items-center justify-between mb-4">
              <h3
                className="font-semibold text-stone-900"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Aktivitas Terbaru
              </h3>
              <Badge className="bg-stone-100 text-stone-600 border-0 text-[10px] shadow-none">
                5 terakhir
              </Badge>
            </div>

            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(activity.status || '')}
                      <div>
                        <p className="text-sm text-stone-800 truncate max-w-50">
                          {activity.message}
                        </p>
                        <p className="text-[10px] text-stone-400">
                          {formatRelativeTime(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                    {activity.status && (
                      <Badge className={`${getStatusColor(activity.status)} text-[10px] shadow-none`}>
                        {activity.status}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-stone-400">
                <Activity className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">Belum ada aktivitas</p>
              </div>
            )}
          </Card>
        </div>

        {/* Footer Info */}
        <Card className="bg-stone-100 border-0 rounded-xl p-4 text-center">
          <p className="text-xs text-stone-500">
            Dashboard Habema Admin • Last updated: {new Date().toLocaleString('id-ID')}
          </p>
        </Card>
      </main>
    </div>
  )
}