"use client";
import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Mail,
  Phone,
  LogOut,
  Edit2,
  Loader2,
  ShieldCheck,
  Clock,
  AlertCircle,
  ChevronRight,
  Camera,
  MapPin,
  User,
  TrendingUp,
  Award,
  CreditCard,
  Package,
  Truck,
  Star,
  Tent,
  Mountain,
  HandCoins,
  Settings,
} from "lucide-react";
import { useAccountData } from "@/lib/account-data";
import {
  getInitials,
  formatDate,
} from "@/components/account/status-config";

export default function AccountPage() {
  const router = useRouter();
  const { user, bookings, shopOrders, addresses, reviewedEquipmentIds, loading } = useAccountData();
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    await supabase.auth.signOut();
    router.replace("/login");
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
          <p className="text-sm text-stone-500">Memuat akun Anda...</p>
        </div>
      </div>
    );
  }
  if (!user) return null;

  const fullName = user.user_metadata?.full_name || "Petualang Habema";
  const email = user.email ?? "";
  const phone = user.phone || null;
  const initials = getInitials(fullName);
  const joinDate = formatDate(user.created_at);

  // ── Stats rental ──
  const rentalPending = bookings.filter((o) => o.status === "pending").length;
  const rentalConfirmed = bookings.filter((o) => o.status === "confirmed").length;
  const rentalActive = bookings.filter((o) => ["picked_up", "active"].includes(o.status)).length;
  const rentalDone = bookings.filter((o) => ["returned", "completed"].includes(o.status)).length;

  // ── Stats pesanan toko ──
  const shopUnpaid = shopOrders.filter((o) => o.payment_status === "pending").length;
  const shopProcessed = shopOrders.filter((o) => o.status === "confirmed" && o.payment_status !== "cancelled").length;
  const shopShipped = shopOrders.filter((o) => o.status === "shipped" && o.payment_status !== "cancelled").length;

  // ── Beri penilaian (shop delivered yang produknya belum direview user) ──
  const toRate = shopOrders.filter((o) => {
    if (o.status !== "delivered") return false;
    const items = o.items || [];
    if (items.length === 0) return true;
    const reviewed = items.filter((i: any) => reviewedEquipmentIds.includes(i.product_id)).length;
    return reviewed < items.length;
  }).length;

  const totalSpend = bookings.reduce((acc, o) => acc + (o.total ?? 0), 0);
  const shopTotalSpend = shopOrders.reduce((acc, o) => acc + (o.total_amount ?? 0), 0);

  const verifications = [
    { label: "Email",          icon: Mail,     status: user.email_confirmed_at ? "ok" : "missing" },
    { label: "Nomor HP",       icon: Phone,    status: user.phone || user.user_metadata?.phone ? "ok" : "missing" },
    { label: "KTP / Identitas", icon: User,    status: user.user_metadata?.identity_verified ? "ok" : "pending" },
    { label: "Alamat",         icon: MapPin,   status: addresses.length > 0 ? "ok" : "missing" },
  ] as const;

  const completedCount = verifications.filter((v) => v.status === "ok").length;

  // ── Stats item helper ──
  const statItem = (Icon: any, label: string, count: number) => (
    <div className="flex items-center justify-between px-4 py-2.5">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
          <Icon className="w-3.5 h-3.5 text-emerald-600" />
        </div>
        <span className="text-xs sm:text-sm font-medium text-stone-600 truncate">{label}</span>
      </div>
      <span className="text-sm font-bold text-stone-900 ml-2 flex-shrink-0">{count}</span>
    </div>
  );

  const statCard = ({
    title,
    href,
    linkLabel,
    accent,
    children,
  }: {
    title: string;
    href: string;
    linkLabel: string;
    accent: string;
    children: React.ReactNode;
  }) => (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-stone-50 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-stone-800">{title}</h3>
        <Link href={href} className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-medium text-emerald-700 hover:text-emerald-900 transition-colors flex-shrink-0">
          <span>{linkLabel}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className={`divide-y divide-stone-50 ${accent}`}>{children}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F7F5]">

      {/* ── HERO PROFILE HEADER ── */}
      <div className="bg-white border-b border-stone-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">{initials}</span>
              </div>
              <button
                onClick={() => router.push("/account/edit")}
                className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 bg-white border-2 border-stone-100 rounded-lg flex items-center justify-center shadow-sm hover:bg-stone-50 transition-colors"
              >
                <Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-stone-600" />
              </button>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-lg sm:text-2xl font-bold text-stone-900 truncate">{fullName}</h1>
                {completedCount === 4 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] sm:text-xs font-semibold rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3 h-3" /> Terverifikasi
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-stone-500 mb-1 sm:mb-2 truncate">{email}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] sm:text-xs text-stone-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Bergabung {joinDate}
                </span>
                {phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    {phone}
                  </span>
                )}
              </div>
            </div>

            {/* Actions: kanan profil */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => router.push("/account/edit")}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-stone-700 bg-stone-100 rounded-xl hover:bg-stone-200 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden md:inline">Edit Profil</span>
              </button>
              <button
                onClick={() => router.push("/account/settings")}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-stone-700 bg-stone-100 rounded-xl hover:bg-stone-200 transition-colors"
              >
                <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden md:inline">Pengaturan</span>
              </button>
              <button
                onClick={handleLogout}
                disabled={logoutLoading}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-stone-600 border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors"
              >
                {logoutLoading ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                <span className="hidden md:inline">Keluar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS SECTION (terpisah dari profil) ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Pesanan Saya (toko) */}
          {statCard({
            title: "Pesanan Saya",
            href: "/account/orders",
            linkLabel: "Lihat Riwayat Pesanan",
            accent: "bg-gradient-to-b from-white to-stone-50/50",
            children: (
              <>
                {statItem(CreditCard, "Belum Bayar", shopUnpaid)}
                {statItem(Package, "Diproses", shopProcessed)}
                {statItem(Truck, "Dikirim", shopShipped)}
                {statItem(Star, "Beri Penilaian", toRate)}
              </>
            ),
          })}

          {/* Rental Peralatan */}
          {statCard({
            title: "Rental Peralatan",
            href: "/account/rentals",
            linkLabel: "Lihat Riwayat Rental",
            accent: "bg-gradient-to-b from-white to-stone-50/50",
            children: (
              <>
                {statItem(CreditCard, "Belum Bayar", rentalPending)}
                {statItem(Package, "Disiapkan", rentalConfirmed)}
                {statItem(Tent, "Dipinjam", rentalActive)}
                {statItem(Award, "Selesai", rentalDone)}
              </>
            ),
          })}

          {/* Open Trip */}
          {statCard({
            title: "Open Trip",
            href: "/account/opentrips",
            linkLabel: "Lihat Riwayat Open Trip",
            accent: "bg-gradient-to-b from-white to-stone-50/50",
            children: (
              <>
                {statItem(Mountain, "Direncanakan", 0)}
                {statItem(HandCoins, "Belum Bayar", 0)}
                {statItem(Tent, "Berlangsung", 0)}
                {statItem(Award, "Selesai", 0)}
              </>
            ),
          })}
        </div>
      </div>

      {/* ── INFO AKUN (bawah stats) ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

          {/* Total Pengeluaran */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <Award className="w-5 h-5 text-emerald-200 opacity-60" />
            </div>
            <p className="text-xs text-emerald-100 mb-1">Total Pengeluaran</p>
            <p className="text-xl sm:text-2xl font-bold text-white">
              Rp {(totalSpend + shopTotalSpend).toLocaleString("id-ID")}
            </p>
            <p className="text-xs text-emerald-200 mt-2">{bookings.length + shopOrders.length} transaksi</p>
          </div>

          {/* Status Akun */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-50">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-stone-800">Status Akun</h3>
                <span className="text-xs font-bold text-emerald-600">{completedCount}/4</span>
              </div>
              <div className="mt-2 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${(completedCount / 4) * 100}%` }}
                />
              </div>
            </div>
            <div className="p-3 space-y-1">
              {verifications.map((item) => (
                <div key={item.label} className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-stone-50 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      item.status === "ok" ? "bg-emerald-50" : item.status === "pending" ? "bg-amber-50" : "bg-red-50"
                    }`}>
                      <item.icon className={`w-3.5 h-3.5 ${
                        item.status === "ok" ? "text-emerald-600" : item.status === "pending" ? "text-amber-500" : "text-red-500"
                      }`} />
                    </div>
                    <span className="text-xs font-medium text-stone-700">{item.label}</span>
                  </div>
                  {item.status === "ok" ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  ) : item.status === "pending" ? (
                    <Clock className="w-4 h-4 text-amber-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                </div>
              ))}
            </div>
            {completedCount < 4 && (
              <div className="px-4 pb-4">
                <button onClick={() => router.push("/account/edit")} className="w-full py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-colors">
                  Lengkapi Verifikasi
                </button>
              </div>
            )}
          </div>

          {/* Menu Akun */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-50">
              <h3 className="text-sm font-semibold text-stone-800">Menu Akun</h3>
            </div>
            {[
              { icon: User,    label: "Edit Profil",   href: "/account/edit" },
              { icon: MapPin,  label: "Alamat Saya",   href: "/account/addresses" },
              { icon: Settings, label: "Pengaturan",   href: "/account/settings" },
            ].map((item) => (
              <Link key={item.label} href={item.href}
                className="flex items-center justify-between px-5 py-3 hover:bg-stone-50 transition-colors border-b border-stone-50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 text-stone-400" />
                  <span className="text-sm text-stone-700">{item.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-300" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
