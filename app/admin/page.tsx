'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users, Package, Calendar, DollarSign, TrendingUp,
  Bell, LogOut, ChevronRight, AlertTriangle, CheckCircle,
  Clock, Eye, EyeOff, Edit, Phone,
} from 'lucide-react'
import { NotificationsPanel } from '@/components/admin/notifications-panel'
import { toast } from 'sonner'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || ''

// ── Types (sama seperti sebelumnya, tidak berubah) ─────────────
interface DashboardStats {
  totalBookings: number; totalUsers: number; totalRevenue: number
  activeBookings: number; pendingBookings: number; completedBookings: number
  anonymousBookings: number; todayBookings: number
}
interface RecentBooking {
  id: string; user_id: string | null; status: string
  total_cost: number; created_at: string; start_date: string; end_date: string
  booking_items: Array<{ equipment: { name: string; image_url?: string }; quantity: number }>
  user_identity?: { id_type?: string; id_number?: string; id_photo_url?: string; verification_status?: string }
  user_profile?: { email?: string; created_at?: string }
  item_count: number
}

// ── Helpers ────────────────────────────────────────────────────
const formatCurrency = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

const STATUS_MAP: Record<string, { cls: string; label: string }> = {
  pending:   { cls: 'bg-amber-50 text-amber-800 border border-amber-200',   label: 'Pending' },
  confirmed: { cls: 'bg-blue-50 text-blue-800 border border-blue-200',      label: 'Confirmed' },
  picked_up: { cls: 'bg-violet-50 text-violet-800 border border-violet-200',label: 'Picked Up' },
  returned:  { cls: 'bg-emerald-50 text-emerald-800 border border-emerald-200', label: 'Returned' },
  cancelled: { cls: 'bg-red-50 text-red-800 border border-red-200',         label: 'Cancelled' },
}

// ── Stat Card ──────────────────────────────────────────────────
const StatCard: React.FC<{
  label: string; 
  value: string | number; 
  hint: string; 
  icon: React.ReactNode; 
  iconBg: string;
}> = ({
  label, value, hint, icon, iconBg,
}) => {
  return (
    <Card className="p-5 bg-white border-stone-200 rounded-2xl shadow-none">
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs text-stone-500">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>{icon}</div>
      </div>
      <p
        className="text-stone-900 font-medium leading-none mb-1.5"
        style={{ fontFamily: "'Fraunces', serif", fontSize: typeof value === 'number' ? '26px' : '18px' }}
      >
        {value}
      </p>
      <p className="text-[10px] text-stone-400">{hint}</p>
    </Card>
  )
}



// ── Main ───────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0, totalUsers: 0, totalRevenue: 0,
    activeBookings: 0, pendingBookings: 0, completedBookings: 0,
    anonymousBookings: 0, todayBookings: 0,
  })
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')

  // ── Auth & data fetching (logika tidak berubah) ───────────────
  useEffect(() => { checkAdminAccess() }, [])
  useEffect(() => { if (userEmail) fetchDashboardData() }, [userEmail])

  const checkAdminAccess = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) { router.push('/admin/login'); return }
      if (!ADMIN_EMAIL || user.email !== ADMIN_EMAIL) {
        toast.error('Access denied. Admin only.')
        router.push('/admin/login'); return
      }
      setUserEmail(user.email)
    } catch { router.push('/admin/login') }
  }

  const fetchDashboardData = async () => {
    try {
      // Mock data — sama persis seperti sebelumnya
      const mockBookings = [
        { id: 'HBM-X7K2MN4P9', user_id: null, status: 'pending', total_cost: 150000, created_at: new Date().toISOString(), start_date: new Date().toISOString().split('T')[0], end_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], rental_days: 1 },
        { id: 'HBM-M3P9KQ2ZR', user_id: 'u1', status: 'confirmed', total_cost: 300000, created_at: new Date(Date.now() - 86400000).toISOString(), start_date: new Date().toISOString().split('T')[0], end_date: new Date(Date.now() + 172800000).toISOString().split('T')[0], rental_days: 2 },
        { id: 'HBM-Q8ZN2VB5L', user_id: 'u2', status: 'picked_up', total_cost: 450000, created_at: new Date(Date.now() - 172800000).toISOString(), start_date: new Date(Date.now() - 86400000).toISOString().split('T')[0], end_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], rental_days: 3 },
        { id: 'HBM-T5VR7CK1J', user_id: null, status: 'returned', total_cost: 225000, created_at: new Date(Date.now() - 259200000).toISOString(), start_date: new Date(Date.now() - 172800000).toISOString().split('T')[0], end_date: new Date(Date.now() - 86400000).toISOString().split('T')[0], rental_days: 2 },
        { id: 'HBM-B2LF4WD8S', user_id: 'u3', status: 'pending', total_cost: 180000, created_at: new Date(Date.now() - 3600000).toISOString(), start_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], end_date: new Date(Date.now() + 259200000).toISOString().split('T')[0], rental_days: 3 },
      ]
      const names = ['Tenda Camping', 'Sleeping Bag', 'Backpack', 'Lampu Camping', 'Matras']
      const bookingsWithItems = mockBookings.map((b, i) => ({
        ...b,
        booking_items: [{ equipment: { name: names[i], image_url: undefined }, quantity: 1 }],
        user_identity: b.user_id ? { id_type: 'ktp', id_number: '1234567890123456', verification_status: 'pending' } : undefined,
        user_profile: b.user_id ? { email: `user${i + 1}@example.com`, created_at: b.created_at } : undefined,
        item_count: 1,
      }))
      const today = new Date().toISOString().split('T')[0]
      setStats({
        totalBookings: mockBookings.length,
        totalUsers: 3,
        totalRevenue: mockBookings.reduce((s, b) => s + b.total_cost, 0),
        activeBookings: mockBookings.filter(b => ['confirmed', 'picked_up'].includes(b.status)).length,
        pendingBookings: mockBookings.filter(b => b.status === 'pending').length,
        completedBookings: mockBookings.filter(b => b.status === 'returned').length,
        anonymousBookings: mockBookings.filter(b => !b.user_id).length,
        todayBookings: mockBookings.filter(b => b.created_at.startsWith(today)).length,
      })
      setRecentBookings(bookingsWithItems)
      toast.info('Dashboard loaded with sample data.')
    } catch { toast.error('Failed to load dashboard') }
    finally { setLoading(false) }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Logout berhasil')
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1EFE8] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const STATUS_OVERVIEW = [
    { dot: 'bg-amber-500',   label: 'Pending',    count: stats.pendingBookings },
    { dot: 'bg-teal-500',    label: 'Aktif',      count: stats.activeBookings },
    { dot: 'bg-emerald-600', label: 'Selesai',    count: stats.completedBookings },
    { dot: 'bg-stone-400',   label: 'Dibatalkan', count: 0 },  
  ]

  const QUICK_ACTIONS = [
    { label: 'Produk',    href: '/admin/equipment', icon: <Package className="w-4 h-4 text-emerald-700" />,  bg: 'bg-emerald-50' },
    { label: 'Pesanan',   href: '/admin/bookings',  icon: <Calendar className="w-4 h-4 text-blue-700" />,    bg: 'bg-blue-50' },
    { label: 'Pengguna',  href: '/admin/users',     icon: <Users className="w-4 h-4 text-violet-700" />,     bg: 'bg-violet-50' },
    { label: 'Analitik',  href: '/admin/analytics', icon: <TrendingUp className="w-4 h-4 text-amber-700" />, bg: 'bg-amber-50' },
  ]

  const MOB_STATUS = [
    { icon: <Clock className="w-4 h-4 text-amber-700" />,     bg: 'bg-amber-50 border-amber-200',   label: 'Perlu Diproses', num: stats.pendingBookings,   numCls: 'text-amber-700' },
    { icon: <Package className="w-4 h-4 text-blue-700" />,    bg: 'bg-blue-50 border-blue-200',     label: 'Aktif',          num: stats.activeBookings,    numCls: 'text-blue-700' },
    { icon: <AlertTriangle className="w-4 h-4 text-red-700"/>, bg: 'bg-red-50 border-red-200',       label: 'Pembatalan',     num: 0,                       numCls: 'text-red-700' },
    { icon: <CheckCircle className="w-4 h-4 text-emerald-700" />, bg: 'bg-emerald-50 border-emerald-200', label: 'Kembali',    num: stats.completedBookings, numCls: 'text-emerald-700' },
    { icon: <Bell className="w-4 h-4 text-violet-700" />,     bg: 'bg-violet-50 border-violet-200', label: 'Penilaian',      num: 0,                       numCls: 'text-violet-700' },
    { icon: <CheckCircle className="w-4 h-4 text-stone-500" />, bg: 'bg-stone-100 border-stone-200', label: 'Selesai',       num: stats.completedBookings, numCls: 'text-stone-600' },
  ]

  return (
    <div className="min-h-screen bg-[#F1EFE8] font-body">

      {/* ── Header ── */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-600" />
            <span
              className="text-base text-stone-900 tracking-tight"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              habema
            </span>
            <span className="hidden sm:inline-block text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-medium">
              Admin
            </span>
            {userEmail && (
              <span className="hidden md:inline-block text-[10px] text-stone-400 font-mono">{userEmail}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <NotificationsPanel />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="h-8 px-3 text-xs text-stone-600 hover:text-red-600 hover:bg-red-50 rounded-lg gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 py-6 space-y-5 max-w-[1400px] mx-auto">

        {/* ── Shop info strip ── */}
        <Card className="px-4 py-3 bg-white border-stone-200 rounded-xl shadow-none">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <Package className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <p
                  className="text-sm font-medium text-stone-900 leading-tight"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  Habema Outdoor
                </p>
                <p className="text-[11px] text-stone-400">Equipment Rental & Outdoor Adventure</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-5 flex-wrap">
              {[
                { icon: <Package className="w-3 h-3" />, text: 'Sleman, Yogyakarta' },
                { icon: <Bell className="w-3 h-3" />,    text: 'habema.vercel.app' },
                { icon: <Phone className="w-3 h-3" />,   text: '+62 812-3456-7890' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-[11px] text-stone-400">
                  {icon} {text}
                </div>
              ))}
            </div>
            <Button
              size="sm"
              className="h-8 px-3 text-xs bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg shadow-none gap-1.5"
              onClick={() => window.open('/', '_blank')}
            >
              <Package className="w-3 h-3" /> Kunjungi
            </Button>
          </div>
        </Card>

        <StatCard
            label="Total Pendapatan" value={formatCurrency(stats.totalRevenue)} hint="Sepanjang waktu"
            icon={<DollarSign className="w-4 h-4 text-amber-700 hidden md:block" />} iconBg="bg-amber-50"
          />

        {/* ── Mobile: status grid + nav ── */}
        <Card className="lg:hidden p-4 bg-white border-stone-200 rounded-xl shadow-none space-y-4">
          <div className="grid grid-cols-3 gap-2.5">
            {MOB_STATUS.map(({ icon, bg, label, num, numCls }) => (
              <div key={label} className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${bg}`}>
                <div className="w-8 h-8 bg-white/70 rounded-full flex items-center justify-center">{icon}</div>
                <span className="text-[10px] text-stone-600 text-center leading-tight">{label}</span>
                <span className={`text-xs font-semibold ${numCls}`}>{num}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-stone-100 pt-3">
           
            <div className="grid grid-cols-4 gap-2">
              {QUICK_ACTIONS.map(({ label, href, icon, bg }) => (
                <Link key={label} href={href}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-stone-100 hover:bg-stone-50 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bg}`}>{icon}</div>
                  <span className="text-[10px] text-stone-500 font-medium">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </Card>

        {/* ── Desktop: stat cards ── */}
        <div className="hidden lg:grid grid-cols-4 gap-4">
          <StatCard
            label="Total Pesanan" value={stats.totalBookings} hint={`+${stats.todayBookings} hari ini`}
            icon={<Calendar className="w-4 h-4 text-blue-700" />} iconBg="bg-blue-50"
          />
          <StatCard
            label="Total Pengguna" value={stats.totalUsers} hint="Pengguna terdaftar"
            icon={<Users className="w-4 h-4 text-emerald-700" />} iconBg="bg-emerald-50"
          />
          <StatCard
            label="Total Pendapatan" value={formatCurrency(stats.totalRevenue)} hint="Sepanjang waktu"
            icon={<DollarSign className="w-4 h-4 text-amber-700 hidden md:block" />} iconBg="bg-amber-50"
          />
          <StatCard
            label="Pesanan Tamu" value={stats.anonymousBookings} hint="Tanpa akun"
            icon={<AlertTriangle className="w-4 h-4 text-violet-700" />} iconBg="bg-violet-50"
          />
        </div>

        {/* ── Mid row: status overview + quick actions ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Status overview */}
          <Card className="p-5 bg-white border-stone-200 rounded-xl shadow-none">
            <p className="text-xs text-stone-400 font-medium uppercase tracking-widest mb-4">Status Pesanan</p>
            <div className="space-y-0.5">
              {STATUS_OVERVIEW.map(({ dot, label, count }) => (
                <div key={label} className="flex items-center justify-between py-2.5 border-b border-stone-50 last:border-none">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full ${dot}`} />
                    <span className="text-sm text-stone-600">{label}</span>
                  </div>
                  <span
                    className="text-stone-900 font-medium"
                    style={{ fontFamily: "'Fraunces', serif", fontSize: '16px' }}
                  >
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick actions */}
          <Card className="p-5 bg-white border-stone-200 rounded-xl shadow-none hidden lg:block">
            <p className="text-xs text-stone-400 font-medium uppercase tracking-widest mb-4">Aksi Cepat</p>
            <div className="grid grid-cols-2 gap-2.5">
              {QUICK_ACTIONS.map(({ label, href, icon, bg }) => (
                <Link key={label} href={href}
                  className="flex items-center gap-2.5 px-3 py-2.5 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>{icon}</div>
                  <span className="text-sm text-stone-700 font-medium">{label}</span>
                </Link>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Recent Bookings table ── */}
        <Card className="bg-white border-stone-200 rounded-xl shadow-none overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
            <p
              className="text-sm font-medium text-stone-900"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Pesanan Terbaru
            </p>
            <Button variant="ghost" size="sm"
              className="h-7 px-3 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg gap-1"
              onClick={() => router.push('/admin/bookings')}>
              Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-stone-50">
                  {['ID Pesanan', 'Pelanggan', 'Identitas', 'Item', 'Status', 'Total', 'Tanggal', 'Aksi'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-medium text-stone-400 uppercase tracking-widest whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => {
                  const statusCfg = STATUS_MAP[booking.status] ?? { cls: 'bg-stone-100 text-stone-600 border border-stone-200', label: booking.status }
                  return (
                    <tr key={booking.id} className="border-t border-stone-50 hover:bg-stone-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-[11px] text-stone-400">#{booking.id.slice(0, 11)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {booking.user_id ? (
                            <>
                              <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                <Users className="w-3 h-3 text-emerald-700" />
                              </div>
                              <div>
                                <p className="text-xs font-medium text-stone-800">Terdaftar</p>
                                {booking.user_profile?.email && (
                                  <p className="text-[10px] text-stone-400">{booking.user_profile.email}</p>
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="w-6 h-6 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="w-3 h-3 text-amber-700" />
                              </div>
                              <p className="text-xs font-medium text-stone-800">Tamu</p>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {booking.user_identity ? (
                          <span className="text-[10px] bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-md font-medium">
                            {booking.user_identity.id_type?.toUpperCase()}
                          </span>
                        ) : (
                          <span className="text-[10px] text-stone-400">Tidak ada</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-stone-800">{booking.item_count} item</p>
                        {booking.booking_items[0] && (
                          <p className="text-[10px] text-stone-400">{booking.booking_items[0].equipment.name}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`${statusCfg.cls} text-[10px] font-medium shadow-none`}>
                          {statusCfg.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-stone-800">{formatCurrency(booking.total_cost)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[11px] text-stone-600">{formatDate(booking.created_at)}</p>
                        {booking.start_date && booking.end_date && (
                          <p className="text-[10px] text-stone-400 mt-0.5">
                            {booking.start_date} → {booking.end_date}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => router.push(`/admin/bookings/${booking.id}`)}
                            className="w-7 h-7 rounded-lg border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => router.push(`/admin/bookings/${booking.id}/edit`)}
                            className="w-7 h-7 rounded-lg border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile: card list */}
          <div className="md:hidden divide-y divide-stone-50">
            {recentBookings.map((booking) => {
              const statusCfg = STATUS_MAP[booking.status] ?? { cls: 'bg-stone-100 text-stone-600 border border-stone-200', label: booking.status }
              return (
                <div key={booking.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] text-stone-400">#{booking.id.slice(0, 11)}</span>
                      <Badge className={`${statusCfg.cls} text-[10px] font-medium shadow-none`}>
                        {statusCfg.label}
                      </Badge>
                    </div>
                    <p className="text-xs font-medium text-stone-800 truncate">
                      {booking.booking_items[0]?.equipment.name}
                    </p>
                    <p className="text-[10px] text-stone-400 mt-0.5">{formatDate(booking.created_at)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-medium text-stone-800">{formatCurrency(booking.total_cost)}</p>
                    <button
                      onClick={() => router.push(`/admin/bookings/${booking.id}`)}
                      className="mt-1.5 text-[10px] text-emerald-700 font-medium"
                    >
                      Detail →
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {recentBookings.length === 0 && (
            <div className="py-12 text-center">
              <Calendar className="w-8 h-8 text-stone-200 mx-auto mb-2" />
              <p className="text-sm text-stone-400">Belum ada pesanan</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}