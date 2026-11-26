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
  ArrowUpRight,
  Coins,
  Gift,
  Copy,
  Check,
  Share2,
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
  const [activeTab, setActiveTab] = useState<"semua" | "pesanan" | "rental" | "opentrip">("semua");
  const [copiedReferral, setCopiedReferral] = useState(false);

  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    if (!supabase) {
      setLogoutLoading(false);
      return;
    }
    await supabase.auth.signOut();
    router.replace("/login");
  }, [router]);

  const fullName = (user as any)?.full_name || user?.user_metadata?.full_name || "Petualang Habema";
  const rawIdSuffix = (user?.id || "HABEMA").replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase();
  const namePrefix = fullName.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase() || "HBM";
  const referralCode =
    (user as any)?.referral_code ||
    user?.user_metadata?.referral_code ||
    `HBM-${namePrefix}${rawIdSuffix}`;

  const handleCopyReferral = useCallback(async () => {
    try {
      const link = `${window.location.origin}/register?ref=${referralCode}`;
      await navigator.clipboard.writeText(link);
      setCopiedReferral(true);
      setTimeout(() => setCopiedReferral(false), 2000);
    } catch {
      setCopiedReferral(true);
      setTimeout(() => setCopiedReferral(false), 2000);
    }
  }, [referralCode]);

  const handleShareReferral = useCallback(async () => {
    const shareText = `Gabung petualangan bersama Habema! Gunakan kode referral ${referralCode} saat daftar untuk mendapatkan bonus 250 Koin Cashback.`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Referral Habema",
          text: shareText,
          url: `${window.location.origin}/register?ref=${referralCode}`,
        });
        return;
      } catch {
        // User membatalkan dialog share
      }
    }
    handleCopyReferral();
  }, [referralCode, handleCopyReferral]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 px-6 py-5 rounded-2xl border border-border bg-card">
          <Loader2 className="w-6 h-6 animate-spin text-forest" />
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Memuat Dokumen Anggota...
          </p>
        </div>
      </div>
    );
  }
  if (!user) return null;

  const email = user.email ?? "";
  const phone = (user as any).phone || null;
  const avatarUrl = (user as any).avatar_url || user.user_metadata?.avatar_url || null;
  const provider = (user as any).provider || user.app_metadata?.provider || "email";
  const emailConfirmed = (user as any).email_confirmed ?? !!user.email_confirmed_at;
  const initials = getInitials(fullName);
  const joinDate = formatDate((user as any).created_at || user.created_at);

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

  // ── Poin / Coin Rewards (ambil dari metadata/user atau kalkulasi riwayat transaksi) ──
  const combinedSpend = totalSpend + shopTotalSpend;
  const userPoints = Number(
    (user as any).points_balance ??
      user.user_metadata?.points_balance ??
      Math.floor(combinedSpend / 1000)
  );
  const coinCashbackValue = userPoints * 100; // 1 Koin = Rp100 potongan promo/cashback
  const nextPromoTarget = 500;
  const pointProgressPct = Math.min(100, Math.round((userPoints / nextPromoTarget) * 100));

  // ── Program Referral Stats ──
  const referralInvitedCount = Number(
    (user as any).referral_count ?? user.user_metadata?.referral_count ?? 0
  );
  const referralEarnedCoins = Number(
    (user as any).referral_earned_coins ??
      user.user_metadata?.referral_earned_coins ??
      referralInvitedCount * 250
  );

  const verifications = [
    { label: "Email",           icon: Mail,     status: emailConfirmed ? "ok" : "missing" },
    { label: "Nomor HP",        icon: Phone,    status: phone || user.user_metadata?.phone ? "ok" : "missing" },
    { label: "KTP / Identitas", icon: User,     status: user.user_metadata?.identity_verified ? "ok" : "pending" },
    { label: "Alamat",          icon: MapPin,   status: addresses.length > 0 ? "ok" : "missing" },
  ] as const;

  const loginMethod = provider === "google"
    ? "Google OAuth"
    : provider === "email"
      ? "Email Terdaftar"
      : provider;

  const completedCount = verifications.filter((v) => v.status === "ok").length;

  const totalShopCount = shopUnpaid + shopProcessed + shopShipped + toRate;
  const totalRentalCount = rentalPending + rentalConfirmed + rentalActive + rentalDone;
  const totalOpenTripCount = 0;

  // ── Baris Metrik Status ──
  const statItem = (Icon: any, label: string, count: number, highlight = false) => (
    <div
      className={`flex items-center justify-between px-4 py-3.5 transition-colors ${
        highlight && count > 0 ? "bg-accent/35" : "hover:bg-forest-soft/35"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={`w-8 h-8 rounded-2xl border flex items-center justify-center shrink-0 ${
            highlight && count > 0
              ? "bg-accent border-gold/40 text-accent-foreground"
              : "bg-background border-border text-forest"
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
        </span>
        <span className="text-xs sm:text-sm font-medium text-foreground truncate">{label}</span>
      </div>
      <span
        className={`text-sm font-bold tabular-nums ml-3 shrink-0 ${
          highlight && count > 0
            ? "text-gold"
            : count > 0
              ? "text-forest"
              : "text-muted-foreground"
        }`}
      >
        {String(count).padStart(2, "0")}
      </span>
    </div>
  );

  // ── Modul Ledger Aktivitas ──
  const statCard = ({
    code,
    title,
    href,
    linkLabel,
    totalItems,
    children,
  }: {
    code: string;
    title: string;
    href: string;
    linkLabel: string;
    totalItems: number;
    children: React.ReactNode;
  }) => (
    <section className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border bg-background flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="px-2 py-0.5 rounded-2xl bg-forest text-primary-foreground text-[10px] font-bold uppercase tracking-widest tabular-nums shrink-0">
            {code}
          </span>
          <h3 className="font-sans text-sm sm:text-base font-bold text-foreground truncate">
            {title}
          </h3>
          <span className="hidden sm:inline-block text-[11px] font-semibold text-muted-foreground tabular-nums">
            ({totalItems} aktif)
          </span>
        </div>

        <Link
          href={href}
          className="inline-flex items-center gap-1 text-xs font-bold text-forest hover:text-forest-dark transition-colors shrink-0 group"
        >
          <span>{linkLabel}</span>
          <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
        {children}
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      {/* ── TOP DISPATCH STRIP ── */}
      <div className="border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-2 font-bold uppercase tracking-[0.18em] text-forest">
            <span className="w-2 h-2 rounded-full bg-forest" />
            <span>Direktori Anggota Habema</span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground font-medium">
            <span>Bergabung {joinDate}</span>
            <span>•</span>
            <span className="text-foreground font-semibold">{loginMethod}</span>
          </div>
        </div>
      </div>

      {/* ── ASYMMETRIC TWO-COLUMN WORKSPACE ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* ==========================================================
              KOLOM KIRI (4 KOLOM): PASPOR ANGGOTA & STATUS VERIFIKASI
             ========================================================== */}
          <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-6">
            {/* Kartu Identitas & Ringkasan Dana */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {/* Header Solid Forest */}
              <div className="p-5 bg-forest text-primary-foreground border-b border-forest-dark">
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-2xl border border-primary-foreground/25 bg-forest-dark flex items-center justify-center overflow-hidden">
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarUrl}
                          alt={fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-sans text-xl font-bold text-primary-foreground tracking-tight">
                          {initials}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push("/account/edit")}
                      aria-label="Ubah foto profil"
                      className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-2xl bg-background text-foreground border border-border hover:border-gold flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="min-w-0 flex-1">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-2xl text-[10px] font-bold uppercase tracking-wider mb-1.5 ${
                        completedCount === 4
                          ? "bg-forest-dark text-forest-tint border border-forest-tint/30"
                          : "bg-gold text-secondary-foreground"
                      }`}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      {completedCount === 4
                        ? "Akun Terverifikasi"
                        : `Verifikasi ${completedCount}/4`}
                    </span>
                    <h1 className="font-sans text-lg sm:text-xl font-bold text-primary-foreground truncate leading-snug">
                      {fullName}
                    </h1>
                    <p className="text-xs text-primary-foreground/75 truncate">
                      {email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Metadata Kontak & Total Pengeluaran */}
              <div className="p-5 space-y-4 bg-background">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-2xl border border-border bg-muted/40">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                      Nomor Telepon
                    </span>
                    <span className="font-bold text-foreground tabular-nums truncate block">
                      {phone || "Belum diisi"}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl border border-border bg-muted/40">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                      Total Transaksi
                    </span>
                    <span className="font-bold text-foreground tabular-nums block">
                      {bookings.length + shopOrders.length} Riwayat
                    </span>
                  </div>
                </div>

                {/* Akumulasi Pengeluaran */}
                <div className="p-4 rounded-2xl border border-forest/25 bg-forest-soft/60 flex items-center justify-between gap-3">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-forest">
                      Akumulasi Pengeluaran
                    </span>
                    <span className="font-sans text-xl font-bold text-foreground tabular-nums">
                      Rp {combinedSpend.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-2xl bg-forest text-primary-foreground flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>

                {/* Saldo Poin / Coin Rewards (Promo & Cashback) */}
                <div className="p-4 rounded-2xl border border-gold/40 bg-accent/45 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.16em] text-accent-foreground">
                        <Coins className="w-3.5 h-3.5 text-gold" />
                        Habema Coin &amp; Cashback
                      </span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="font-sans text-xl font-bold text-foreground tabular-nums">
                          {userPoints.toLocaleString("id-ID")} Koin
                        </span>
                        <span className="text-xs font-semibold text-gold tabular-nums">
                          (≈ Rp{coinCashbackValue.toLocaleString("id-ID")})
                        </span>
                      </div>
                    </div>
                    <Link
                      href="/account/rewards"
                      className="px-2.5 py-1.5 rounded-2xl bg-gold hover:bg-gold-light text-secondary-foreground text-[11px] font-bold transition-colors shrink-0"
                    >
                      Tukar Promo
                    </Link>
                  </div>

                  {/* Progress menuju voucher cashback berikutnya */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-accent-foreground/80 tabular-nums">
                      <span>Target Voucher Cashback Rp50.000</span>
                      <span>
                        {Math.min(userPoints, nextPromoTarget)}/{nextPromoTarget} Koin
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-background/80 overflow-hidden">
                      <div
                        className="h-full bg-gold rounded-full transition-all duration-500"
                        style={{ width: `${pointProgressPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Tombol Aksi Profil */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => router.push("/account/edit")}
                    className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl border border-border bg-background hover:border-forest hover:bg-forest-soft text-xs font-bold text-foreground transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-forest" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/account/settings")}
                    className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl border border-border bg-background hover:border-forest hover:bg-forest-soft text-xs font-bold text-foreground transition-colors cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-forest" />
                    <span>Atur</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={logoutLoading}
                    className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl border border-gold/40 bg-accent hover:bg-gold text-accent-foreground hover:text-secondary-foreground text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {logoutLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <LogOut className="w-3.5 h-3.5" />
                    )}
                    <span>Keluar</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Kartu Kelengkapan Verifikasi & Menu Cepat */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="font-sans text-xs font-bold uppercase tracking-wider text-foreground">
                    Status Verifikasi
                  </h2>
                  <span className="text-xs font-bold text-forest tabular-nums">
                    {completedCount}/4
                  </span>
                </div>
                {completedCount < 4 && (
                  <button
                    type="button"
                    onClick={() => router.push("/account/edit")}
                    className="text-[11px] font-bold text-gold hover:underline cursor-pointer"
                  >
                    Lengkapi →
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              <div className="h-1 w-full bg-muted">
                <div
                  className="h-full bg-forest transition-all duration-500"
                  style={{ width: `${(completedCount / 4) * 100}%` }}
                />
              </div>

              <div className="divide-y divide-border">
                {verifications.map((item) => (
                  <div
                    key={item.label}
                    className="px-5 py-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <item.icon
                        className={`w-4 h-4 shrink-0 ${
                          item.status === "ok"
                            ? "text-forest"
                            : item.status === "pending"
                              ? "text-gold"
                              : "text-muted-foreground"
                        }`}
                      />
                      <span className="text-xs font-medium text-foreground truncate">
                        {item.label}
                      </span>
                    </div>

                    {item.status === "ok" ? (
                      <span className="text-[11px] font-bold text-forest inline-flex items-center gap-1 shrink-0">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Valid
                      </span>
                    ) : item.status === "pending" ? (
                      <span className="text-[11px] font-bold text-gold inline-flex items-center gap-1 shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                        Proses
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-destructive inline-flex items-center gap-1 shrink-0">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Kosong
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Pintasan Halaman Akun */}
              <div className="p-3 bg-muted/40 border-t border-border space-y-1">
                {[
                  { icon: Coins, label: "Koin & Voucher Cashback", href: "/account/rewards" },
                  { icon: User, label: "Edit Profil & Identitas", href: "/account/edit" },
                  { icon: MapPin, label: "Daftar Alamat Pengiriman", href: "/account/addresses" },
                  { icon: Settings, label: "Pengaturan Keamanan", href: "/account/settings" },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center justify-between px-3 py-2 rounded-2xl hover:bg-background text-xs font-semibold text-foreground/85 hover:text-forest transition-colors group"
                  >
                    <span className="flex items-center gap-2.5">
                      <item.icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-forest" />
                      {item.label}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-forest group-hover:translate-x-0.5 transition-all" />
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          {/* ==========================================================
              KOLOM KANAN (8 KOLOM): LEDGER AKTIVITAS & TAB KATEGORI
             ========================================================== */}
          <main className="lg:col-span-8 space-y-5">
            {/* Header & Underline Tab Bar */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-5 pt-5 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest block mb-1">
                    Ringkasan Operasional
                  </span>
                  <h2 className="font-sans text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                    Aktivitas &amp; Status Transaksi
                  </h2>
                </div>
                <span className="text-xs text-muted-foreground font-medium tabular-nums">
                  {totalShopCount + totalRentalCount + totalOpenTripCount} item dalam pantauan
                </span>
              </div>

              {/* Underline Tabs (Anti-Slop, Non-Generic Pill) */}
              <div
                role="tablist"
                aria-label="Filter kategori aktivitas"
                className="flex items-center gap-1 px-3 border-t border-border bg-muted/30 overflow-x-auto no-scrollbar"
              >
                {[
                  {
                    id: "semua" as const,
                    label: "Semua Kategori",
                    count: totalShopCount + totalRentalCount + totalOpenTripCount,
                  },
                  {
                    id: "pesanan" as const,
                    label: "Pesanan Toko",
                    count: totalShopCount,
                  },
                  {
                    id: "rental" as const,
                    label: "Rental Gear",
                    count: totalRentalCount,
                  },
                  {
                    id: "opentrip" as const,
                    label: "Open Trip",
                    count: totalOpenTripCount,
                  },
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative px-3.5 py-3 text-xs font-bold whitespace-nowrap inline-flex items-center gap-2 transition-colors cursor-pointer border-b-2 ${
                        isActive
                          ? "border-forest text-forest"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-2xl text-[10px] tabular-nums ${
                          isActive
                            ? "bg-forest text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Daftar Modul Aktivitas sesuai Tab */}
            <div className="space-y-4">
              {(activeTab === "semua" || activeTab === "pesanan") &&
                statCard({
                  code: "01",
                  title: "Pesanan Saya",
                  href: "/account/orders",
                  linkLabel: "Lihat Riwayat Pesanan",
                  totalItems: totalShopCount,
                  children: (
                    <>
                      {statItem(CreditCard, "Belum Bayar", shopUnpaid, true)}
                      {statItem(Package, "Diproses", shopProcessed)}
                      {statItem(Truck, "Dikirim", shopShipped)}
                      {statItem(Star, "Beri Penilaian", toRate, true)}
                    </>
                  ),
                })}

              {(activeTab === "semua" || activeTab === "rental") &&
                statCard({
                  code: "02",
                  title: "Rental Peralatan",
                  href: "/account/rentals",
                  linkLabel: "Lihat Riwayat Rental",
                  totalItems: totalRentalCount,
                  children: (
                    <>
                      {statItem(CreditCard, "Belum Bayar", rentalPending, true)}
                      {statItem(Package, "Disiapkan", rentalConfirmed)}
                      {statItem(Tent, "Dipinjam", rentalActive)}
                      {statItem(Award, "Selesai", rentalDone)}
                    </>
                  ),
                })}

              {(activeTab === "semua" || activeTab === "opentrip") &&
                statCard({
                  code: "03",
                  title: "Open Trip",
                  href: "/account/opentrips",
                  linkLabel: "Lihat Riwayat Open Trip",
                  totalItems: totalOpenTripCount,
                  children: (
                    <>
                      {statItem(Mountain, "Direncanakan", 0)}
                      {statItem(HandCoins, "Belum Bayar", 0, true)}
                      {statItem(Tent, "Berlangsung", 0)}
                      {statItem(Award, "Selesai", 0)}
                    </>
                  ),
                })}
            </div>

            {/* ==========================================================
                PROGRAM REFERRAL & BONUS KOIN CASHBACK
               ========================================================== */}
            <section className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border bg-forest-soft/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-2xl bg-forest text-primary-foreground flex items-center justify-center shrink-0">
                    <Gift className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-forest">
                      Program Referral Anggota
                    </span>
                    <h3 className="font-sans text-sm sm:text-base font-bold text-foreground">
                      Ajak Teman &amp; Dapatkan 250 Koin Cashback
                    </h3>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-accent-foreground bg-accent border border-gold/30 px-2.5 py-1 rounded-2xl w-fit tabular-nums">
                  +250 Koin / Teman Bergabung
                </span>
              </div>

              <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-background">
                {/* Kotak Salin Kode Referral */}
                <div className="md:col-span-7 space-y-2">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Bagikan kode referral Anda ke teman pendaki. Setiap transaksi rental atau open trip pertama mereka memberi Anda{" "}
                    <strong className="text-foreground">250 Koin (senilai Rp25.000 cashback)</strong>.
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex-1 flex items-center justify-between px-3.5 h-11 rounded-2xl border border-dashed border-forest bg-forest-soft/40">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Kode Anda
                      </span>
                      <span className="font-mono text-sm font-bold tracking-widest text-forest select-all">
                        {referralCode}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyReferral}
                      className="inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-2xl border border-border bg-background hover:border-forest hover:bg-forest-soft text-xs font-bold text-foreground transition-colors cursor-pointer shrink-0"
                    >
                      {copiedReferral ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-forest" />
                          <span className="text-forest">Link Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-forest" />
                          <span>Salin Link</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleShareReferral}
                      aria-label="Bagikan kode referral"
                      className="inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-2xl bg-gold hover:bg-gold-light text-secondary-foreground text-xs font-bold transition-colors cursor-pointer shrink-0"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Bagikan</span>
                    </button>
                  </div>
                </div>

                {/* Statistik Referral */}
                <div className="md:col-span-5 grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl border border-border bg-muted/40">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      Teman Bergabung
                    </span>
                    <span className="font-sans text-lg font-bold text-foreground tabular-nums">
                      {String(referralInvitedCount).padStart(2, "0")} Orang
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl border border-gold/30 bg-accent/40">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-accent-foreground mb-1">
                      Bonus Terkumpul
                    </span>
                    <span className="font-sans text-lg font-bold text-gold tabular-nums">
                      {referralEarnedCoins.toLocaleString("id-ID")} Koin
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}