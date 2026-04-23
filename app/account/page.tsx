'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
// Hilangkan import useCartStore jika ingin data murni dari DB Supabase
import {
  Mail, Phone, LogOut, Edit2, Loader2,
  ShieldCheck, ShieldAlert, Bell, Package, Plus, Trash2,
  Clock, AlertCircle,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────
interface UserProfile {
  id: string
  email: string
  phone?: string
  user_metadata: {
    full_name?: string
    avatar_url?: string
  }
  created_at: string
}

interface DBOrder {
  id: string
  items: string[]
  total: number
  status: string
  pickup_date: string
  created_at: string
}

interface DBAddress {
  id: string
  label: string
  address_details: string
  is_primary: boolean
}

// ── Helpers ────────────────────────────────────────────────────
const getInitials = (name: string) =>
  name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

const DEFAULT_NOTIF = {
  order_confirm: true,
  return_reminder: true,
  promo: false,
  whatsapp: true,
  weekly_email: false,
}

export default function AccountPage() {
  const router = useRouter()
  
  // ── States ──
  const [user, setUser] = useState<UserProfile | null>(null)
  const [dbOrders, setDbOrders] = useState<DBOrder[]>([])
  const [addresses, setAddresses] = useState<DBAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [notif, setNotif] = useState(DEFAULT_NOTIF)

  // ── Fetch Data ──
  const fetchData = useCallback(async () => {
    try {
      // 1. Get Auth User
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      if (authError || !authUser) {
        router.replace('/login')
        return
      }
      setUser(authUser as UserProfile)

      // 2. Get Orders dari Tabel 'orders'
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })
      
      if (ordersData) setDbOrders(ordersData)

      // 3. Get Addresses dari Tabel 'addresses' (atau 'profiles')
      const { data: addrData } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', authUser.id)
      
      if (addrData) setAddresses(addrData)

    } catch (err) {
      console.error("Error syncing data:", err)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleLogout = useCallback(async () => {
    setLogoutLoading(true)
    await supabase.auth.signOut()
    router.replace('/login')
  }, [router])

  const toggleNotif = (key: keyof typeof DEFAULT_NOTIF) =>
    setNotif((prev) => ({ ...prev, [key]: !prev[key] }))

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1EFE8] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
      </div>
    )
  }

  if (!user) return null

  // ── Derived Data ──
  const fullName = user.user_metadata?.full_name || 'Petualang Habema'
  const email = user.email ?? ''
  const phone = user.phone || null
  const initials = getInitials(fullName)
  const joinDate = formatDate(user.created_at)

  const activeOrders = dbOrders.filter((o) => !['returned', 'completed', 'cancelled'].includes(o.status))
  const historyOrders = dbOrders.filter((o) => ['returned', 'completed'].includes(o.status))
  const totalSpend = dbOrders.reduce((acc, o) => acc + (o.total ?? 0), 0)

  const verifications = [
    { label: 'Email', status: 'ok' as const },
    { label: 'Nomor HP', status: phone ? 'ok' as const : 'missing' as const },
    { label: 'KTP / Identitas', status: 'pending' as const },
    { label: 'Alamat', status: addresses.length > 0 ? 'ok' as const : 'missing' as const },
  ]

  const BADGE_MAP = {
    ok:      { cls: 'bg-emerald-50 text-emerald-800 border-emerald-200', label: '✓ Terverifikasi' },
    pending: { cls: 'bg-amber-50 text-amber-800 border-amber-200',       label: 'Sedang Diproses' },
    missing: { cls: 'bg-stone-100 text-stone-600 border-stone-200',      label: 'Belum Diisi' },
  }

  const NOTIF_ITEMS: { key: keyof typeof DEFAULT_NOTIF; title: string; sub: string }[] = [
    { key: 'order_confirm',  title: 'Konfirmasi Pesanan',    sub: 'Notifikasi saat pesanan dikonfirmasi admin' },
    { key: 'return_reminder',title: 'Pengingat Pengembalian',sub: 'Peringatan H-1 sebelum batas kembali alat' },
    { key: 'promo',          title: 'Promo & Penawaran',     sub: 'Diskon eksklusif dan perlengkapan baru' },
    { key: 'whatsapp',       title: 'Notifikasi WhatsApp',   sub: 'Kirim status pesanan via pesan WhatsApp' },
    { key: 'weekly_email',   title: 'Email Mingguan',        sub: 'Ringkasan aktivitas akun tiap minggu' },
  ]

  return (
    <div className="min-h-screen min-w-7xl mx-auto bg-[#F1EFE8] font-body">
      {/* Top bar */}
      <div className="border-b border-stone-200 bg-white px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-semibold text-stone-900 tracking-tight" style={{ fontFamily: "'Fraunces', serif" }}>
            Akun Saya
          </h1>
          <p className="text-sm text-stone-500 mt-0.5">Kelola profil dan pengaturan akun Anda</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">

          {/* SIDEBAR */}
          <div className="space-y-4">
            <div className="bg-[#085041] rounded-2xl p-5 text-[#E1F5EE]">
              <div className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center mb-4"
                style={{ fontFamily: "'Fraunces', serif", fontSize: '20px' }}>
                {initials}
              </div>

              <p className="font-medium text-base leading-tight mb-1">{user.user_metadata?.full_name || "Nama belum diatur"}</p>
              <p className="text-xs text-[#9FE1CB] mb-4 break-all">{email}</p>

              <div className="border-t border-white/10 pt-4 space-y-2.5 mb-4">
                <div className="flex items-center gap-2 text-xs text-[#9FE1CB]">
                  <Phone className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                  {user.phone || 'Belum ada nomor'}
                </div>
                <div className="flex items-center gap-2 text-xs text-[#9FE1CB]">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                  {email}
                </div>
                <div className="flex items-center gap-2 text-xs text-[#9FE1CB]">
                  <Clock className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                  Bergabung {joinDate}
                </div>
              </div>

              <div className="border-t border-white/10 pt-4 space-y-2">
                <Button variant="ghost" size="sm" className="w-full h-9 rounded-lg bg-white/10 hover:bg-white/20 text-[#E1F5EE] text-xs font-medium gap-1.5 border-none" asChild>
                  <Link href="/account/edit" className="flex items-center justify-center gap-1.5">
                    <Edit2 className="w-3.5 h-3.5" /> Edit Profil
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" disabled={logoutLoading} onClick={handleLogout} className="w-full h-9 rounded-lg bg-red-500/20 hover:bg-red-500/35 text-red-200 text-xs font-medium gap-1.5 border-none">
                  {logoutLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                  Keluar
                </Button>
              </div>
            </div>

            <Card className="p-4 bg-white border-stone-200 rounded-2xl shadow-none">
              <h3 className="text-xs font-medium text-stone-900 uppercase tracking-widest mb-3">Status Verifikasi</h3>
              <div className="space-y-2.5">
                {verifications.map(({ label, status }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-xs text-stone-500">{label}</span>
                    <Badge className={`${BADGE_MAP[status].cls} border text-[10px] font-medium px-2 py-0.5 shadow-none`}>
                      {BADGE_MAP[status].label}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* MAIN PANEL */}
          <Card className="bg-white border-stone-200 rounded-2xl shadow-none overflow-hidden">
            <Tabs defaultValue="profil" className="flex flex-col">
              <TabsList className="bg-stone-50 border-b border-stone-100 rounded-none px-0 h-auto justify-start gap-0 p-0">
                {['profil', 'pesanan', 'alamat', 'keamanan', 'notifikasi'].map((val) => (
                  <TabsTrigger key={val} value={val} className="rounded-none h-11 px-5 text-xs font-medium text-stone-400 border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-800 data-[state=active]:bg-white capitalize">
                    {val}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="profil" className="p-6 space-y-6 mt-0">
                <div>
                  <p className="text-[10px] text-stone-400 font-medium uppercase tracking-widest mb-3">Ringkasan Aktivitas</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { num: dbOrders.length, label: 'Total Sewa' },
                      { num: activeOrders.length, label: 'Aktif' },
                      { num: formatCurrency(totalSpend), label: 'Total Belanja' },
                    ].map(({ num, label }) => (
                      <div key={label} className="bg-stone-50 rounded-xl p-3 text-center">
                        <p className="text-stone-900 font-medium leading-tight mb-1" style={{ fontFamily: "'Fraunces', serif", fontSize: typeof num === 'number' ? '22px' : '14px' }}>
                          {num}
                        </p>
                        <p className="text-[10px] text-stone-400">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t border-stone-100" />
                <div>
                  <p className="text-[10px] text-stone-400 font-medium uppercase tracking-widest mb-3">Informasi Pribadi</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Nama Lengkap', val: fullName },
                      { label: 'Email', val: email },
                      { label: 'Nomor HP', val: phone ?? '—' },
                      { label: 'Bergabung Sejak', val: joinDate },
                      { label: 'Status Akun', val: 'Member Aktif', green: true },
                    ].map(({ label, val, green }) => (
                      <div key={label} className="bg-stone-50 rounded-xl px-4 py-3">
                        <p className="text-[10px] text-stone-400 mb-1 tracking-wider uppercase">{label}</p>
                        <p className={`text-sm font-medium ${green ? 'text-emerald-800' : 'text-stone-800'}`}>{val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="pesanan" className="p-6 space-y-5 mt-0">
                <div>
                  <p className="text-[10px] text-stone-400 font-medium uppercase tracking-widest mb-3">Pesanan Aktif</p>
                  {activeOrders.length === 0 ? (
                    <div className="border border-dashed border-stone-200 rounded-xl p-8 text-center">
                      <Package className="w-8 h-8 text-stone-300 mx-auto mb-3" />
                      <p className="text-sm font-medium text-stone-700 mb-1">Tidak ada pesanan aktif</p>
                      <Button size="sm" className="bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs h-8" asChild>
                        <Link href="/catalog">Sewa Sekarang</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeOrders.map((o) => (
                        <div key={o.id} className="flex items-center justify-between border border-stone-100 rounded-xl px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-stone-800">{o.items?.[0] || 'Item Sewa'}</p>
                            <p className="text-xs text-stone-400 mt-0.5">{o.pickup_date} · {o.items?.length || 0} item</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-emerald-800">{formatCurrency(o.total)}</p>
                            <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-[10px] mt-1 shadow-none capitalize">
                              {o.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="alamat" className="p-6 mt-0">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] text-stone-400 font-medium uppercase tracking-widest">Alamat Tersimpan</p>
                  <Button size="sm" className="h-8 px-3 text-xs rounded-lg bg-emerald-800 text-white gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Tambah Alamat
                  </Button>
                </div>
                <div className="space-y-3">
                  {addresses.length === 0 ? (
                    <p className="text-xs text-stone-400 text-center py-6">Belum ada alamat tersimpan.</p>
                  ) : (
                    addresses.map((addr) => (
                      <div key={addr.id} className="relative border border-stone-200 rounded-xl px-4 py-3">
                        {addr.is_primary && (
                          <Badge className="absolute top-3 right-3 bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px]">Utama</Badge>
                        )}
                        <p className="text-[10px] text-stone-400 mb-1 uppercase tracking-wider">{addr.label}</p>
                        <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">{addr.address_details}</p>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
              
              {/* Tab Keamanan & Notifikasi tetap menggunakan state lokal/UI static sesuai permintaan */}
              <TabsContent value="keamanan" className="p-6 mt-0">
                 {/* ... Konten Keamanan ... */}
              </TabsContent>

            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  )
}