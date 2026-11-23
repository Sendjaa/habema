"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Coins,
  Copy,
  Gift,
  History,
  Loader2,
  Mountain,
  Share2,
  ShieldCheck,
  Sparkles,
  Tag,
  Tent,
  Ticket,
  Users,
} from "lucide-react";
import { useAccountData } from "@/lib/account-data";
import { formatDate } from "@/components/account/status-config";

interface PromoCatalogItem {
  id: string;
  code: string;
  title: string;
  category: "rental" | "opentrip" | "shop";
  categoryLabel: string;
  discountText: string;
  coinCost: number;
  minTransaction: number;
  validDays: number;
  description: string;
}

interface RedeemedVoucher {
  voucherId: string;
  promoCode: string;
  title: string;
  discountText: string;
  redeemedAt: string;
  expiresAt: string;
}

const PROMO_CATALOG: PromoCatalogItem[] = [
  {
    id: "promo-rental-25k",
    code: "HBM-RENT25",
    title: "Potongan Sewa Gear Rp25.000",
    category: "rental",
    categoryLabel: "Rental Peralatan",
    discountText: "Diskon Rp25.000",
    coinCost: 250,
    minTransaction: 100000,
    validDays: 30,
    description:
      "Berlaku untuk seluruh penyewaan tenda, carrier, sleeping bag, dan alat masak di Pool Habema.",
  },
  {
    id: "promo-trip-50k",
    code: "HBM-TRIP50",
    title: "Cashback Open Trip Rp50.000",
    category: "opentrip",
    categoryLabel: "Open Trip",
    discountText: "Potongan Rp50.000",
    coinCost: 500,
    minTransaction: 450000,
    validDays: 45,
    description:
      "Dapat digunakan saat pelunasan atau booking DP semua jadwal Open Trip Habema.",
  },
  {
    id: "promo-rental-20pct",
    code: "HBM-GEAR20",
    title: "Diskon 20% Paket Pendakian Lengkap",
    category: "rental",
    categoryLabel: "Rental Peralatan",
    discountText: "Diskon 20% (Maks. Rp40rb)",
    coinCost: 350,
    minTransaction: 150000,
    validDays: 30,
    description:
      "Khusus penyewaan minimal 3 item perlengkapan dalam satu kode pemesanan.",
  },
  {
    id: "promo-shop-15k",
    code: "HBM-SHOP15",
    title: "Voucher Belanja Logistik Rp15.000",
    category: "shop",
    categoryLabel: "Toko Outdoor",
    discountText: "Diskon Rp15.000",
    coinCost: 150,
    minTransaction: 75000,
    validDays: 30,
    description:
      "Berlaku untuk pembelian gas kaleng, makanan kering lapangan, dan aksesoris pendakian.",
  },
  {
    id: "promo-trip-100k",
    code: "HBM-SUMMIT100",
    title: "Voucher Ekspedisi Prioritas Rp100.000",
    category: "opentrip",
    categoryLabel: "Open Trip",
    discountText: "Potongan Rp100.000",
    coinCost: 950,
    minTransaction: 700000,
    validDays: 60,
    description:
      "Potongan langsung untuk kloter pendakian 3 hari 2 malam atau rute elevasi di atas 2.500 MDPL.",
  },
  {
    id: "promo-rental-free1d",
    code: "HBM-EXTRA1D",
    title: "Gratis Tambahan 1 Hari Sewa",
    category: "rental",
    categoryLabel: "Rental Peralatan",
    discountText: "Gratis 1 Malam",
    coinCost: 400,
    minTransaction: 120000,
    validDays: 30,
    description:
      "Tambahan durasi sewa 24 jam tanpa biaya ekstra untuk antisipasi keterlambatan perjalanan pulang.",
  },
];

export default function AccountRewardsPage() {
  const { user, bookings, shopOrders, loading } = useAccountData();

  const [activeTab, setActiveTab] = useState<"katalog" | "voucher" | "riwayat">("katalog");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "rental" | "opentrip" | "shop">("all");
  const [coinBalance, setCoinBalance] = useState<number>(0);
  const [transactionHistory, setTransactionHistory] = useState<any[]>([]);
  const [redeemedVouchers, setRedeemedVouchers] = useState<RedeemedVoucher[]>([]);
  const [confirmItem, setConfirmItem] = useState<PromoCatalogItem | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [redeemLoading, setRedeemLoading] = useState(false);

  const loadRewardData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch("/api/rewards/history", { credentials: "include" });
      if (!res.ok) return;
      const json = await res.json();
      if (!json?.success) return;

      const data = json.data;
      setCoinBalance(Number(data.coinBalance ?? 0));
      setTransactionHistory(Array.isArray(data.transactions) ? data.transactions : []);
      setRedeemedVouchers(
        (Array.isArray(data.vouchers) ? data.vouchers : []).map((v: any) => ({
          voucherId: String(v.id ?? v.voucher_id ?? ""),
          promoCode: String(v.promo_code ?? ""),
          title: String(v.title ?? ""),
          discountText: String(v.discount_text ?? ""),
          redeemedAt: formatDate(v.created_at),
          expiresAt: formatDate(v.expires_at),
        }))
      );
    } catch (error) {
      console.error("[rewards] gagal memuat data:", error);
    }
  }, [user?.id]);

  useEffect(() => {
    loadRewardData();
  }, [loadRewardData]);

  const fullName =
    (user as any)?.full_name || user?.user_metadata?.full_name || "Petualang Habema";
  const rawIdSuffix = (user?.id || "HABEMA")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 4)
    .toUpperCase();
  const namePrefix =
    fullName.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase() || "HBM";
  const referralCode =
    (user as any)?.referral_code ||
    user?.user_metadata?.referral_code ||
    `HBM-${namePrefix}${rawIdSuffix}`;
  const referralLink = `${typeof window !== "undefined" ? window.location.origin : ""}/register?ref=${referralCode}`;

  const handleCopyText = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback aman bila clipboard API dibatasi
    }
    setCopiedCode(text);
    setTimeout(() => setCopiedCode((prev) => (prev === text ? null : prev)), 2000);
  }, []);

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
        // Pengguna membatalkan dialog share
      }
    }
    handleCopyText(referralLink);
  }, [referralCode, referralLink, handleCopyText]);

  const currentCoins = Math.max(
    0,
    Number(coinBalance || (user as any)?.coin_balance || 0)
  );
  const cashbackRupiah = currentCoins * 100;

  // Riwayat mutasi koin otomatis dari transaksi selesai + penukaran lokal
  const coinHistory = useMemo(() => {
    const entries: {
      id: string;
      type: "earn" | "redeem";
      title: string;
      date: string;
      coins: number;
    }[] = [];

    transactionHistory.forEach((t: any) => {
      entries.push({
        id: String(t.id),
        type: t.type === "redeem" ? "redeem" : "earn",
        title: String(t.description ?? "Mutasi koin"),
        date: formatDate(t.created_at),
        coins: Number(t.amount ?? 0),
      });
    });

    bookings.forEach((b: any) => {
      const earned = Math.floor((b.total ?? 0) / 1000);
      if (earned > 0) {
        entries.push({
          id: `rent-${b.id}`,
          type: "earn",
          title: `Cashback Koin Rental Gear #${String(b.id).slice(0, 6).toUpperCase()}`,
          date: formatDate(b.created_at),
          coins: earned,
        });
      }
    });

    shopOrders.forEach((s: any) => {
      const earned = Math.floor((s.total_amount ?? 0) / 1000);
      if (earned > 0) {
        entries.push({
          id: `shop-${s.id}`,
          type: "earn",
          title: `Cashback Koin Belanja Toko #${String(s.id).slice(0, 6).toUpperCase()}`,
          date: formatDate(s.created_at),
          coins: earned,
        });
      }
    });

    return entries;
  }, [bookings, shopOrders, transactionHistory]);

  const filteredPromos = useMemo(() => {
    if (categoryFilter === "all") return PROMO_CATALOG;
    return PROMO_CATALOG.filter((item) => item.category === categoryFilter);
  }, [categoryFilter]);

  const handleConfirmRedeem = async () => {
    if (!confirmItem || redeemLoading) return;
    if (currentCoins < confirmItem.coinCost) {
      setConfirmItem(null);
      return;
    }

    const item = confirmItem;
    setRedeemLoading(true);

    try {
      const res = await fetch("/api/rewards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ voucherId: item.id }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Gagal menukar koin");
      }

      setCoinBalance((prev) => Math.max(0, prev - item.coinCost));
      setStatusBanner(
        `Berhasil menukar ${item.coinCost} Koin menjadi voucher "${item.title}" (${item.code}).`
      );
      setConfirmItem(null);
      setActiveTab("voucher");
      await loadRewardData();
    } catch (error: any) {
      setStatusBanner(error?.message || "Gagal menukar koin");
    } finally {
      setRedeemLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 px-6 py-5 rounded-2xl border border-border bg-card">
          <Loader2 className="w-6 h-6 animate-spin text-forest" />
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Memuat Saldo Koin &amp; Promo...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const referralInvitedCount = Number(
    (user as any).referral_count ?? user.user_metadata?.referral_count ?? 0
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-body lg:mt-5">
      {/* ── TOP NAVIGATION BAR ── */}
      <div className="border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <Link
            href="/account"
            className="inline-flex items-center gap-1.5 font-bold text-forest hover:text-forest-dark transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Ringkasan Akun</span>
          </Link>
          <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
            Konversi Tetap: <strong className="text-foreground">1 Koin = Rp100</strong>
          </span>
        </div>
      </div>

      {/* ── MAIN WORKSPACE ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Notifikasi Berhasil Tukar Voucher */}
        {statusBanner && (
          <div className="p-4 rounded-2xl border border-forest bg-forest-soft flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-forest-dark">
              <Check className="w-4 h-4 text-forest shrink-0" />
              <span>{statusBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusBanner(null)}
              className="text-xs font-bold text-forest hover:underline shrink-0 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {/* ==========================================================
            HERO BALANCE & REFERRAL DISPATCH (2 KOLOM)
           ========================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Kartu Saldo Koin Utama (7 Kolom) */}
          <section className="lg:col-span-7 rounded-2xl border border-border bg-forest text-primary-foreground p-6 sm:p-7 flex flex-col justify-between gap-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-2xl bg-forest-dark border border-forest-tint/30 text-[10px] font-bold uppercase tracking-[0.18em] text-forest-tint mb-3">
                  <Coins className="w-3.5 h-3.5" />
                  Habema Coin &amp; Cashback
                </span>
                <h1 className="font-sans text-3xl sm:text-4xl font-bold tracking-tight text-primary-foreground tabular-nums">
                  {currentCoins.toLocaleString("id-ID")} Koin
                </h1>
                <p className="text-xs sm:text-sm text-primary-foreground/80 mt-1 tabular-nums">
                  Setara nilai potongan promo &amp; cashback{" "}
                  <strong className="text-primary-foreground">
                    Rp{cashbackRupiah.toLocaleString("id-ID")}
                  </strong>
                </p>
              </div>

              <div className="px-3.5 py-2.5 rounded-2xl bg-forest-dark border border-primary-foreground/15 text-right">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-forest-tint">
                  Skema Perolehan
                </span>
                <span className="text-xs font-bold text-primary-foreground tabular-nums">
                  1 Koin tiap Rp1.000 transaksi
                </span>
              </div>
            </div>

            {/* 3 Cara Mendapatkan Koin */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-4 border-t border-primary-foreground/15 text-xs">
              <div className="p-3 rounded-2xl bg-forest-dark/80 border border-primary-foreground/10">
                <span className="block font-bold text-forest-tint mb-0.5">
                  01. Rental &amp; Toko
                </span>
                <span className="text-primary-foreground/80 text-[11px] leading-snug block">
                  Cashback otomatis 0,1% dalam bentuk koin setelah pesanan selesai.
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-forest-dark/80 border border-primary-foreground/10">
                <span className="block font-bold text-forest-tint mb-0.5">
                  02. Open Trip Kloter
                </span>
                <span className="text-primary-foreground/80 text-[11px] leading-snug block">
                  Bonus koin setelah menyelesaikan pendakian bersama Habema.
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-forest-dark/80 border border-primary-foreground/10">
                <span className="block font-bold text-forest-tint mb-0.5">
                  03. Ajak Teman
                </span>
                <span className="text-primary-foreground/80 text-[11px] leading-snug block">
                  +250 Koin langsung saat teman menyelesaikan transaksi perdana.
                </span>
              </div>
            </div>
          </section>

          {/* Kartu Kode Referral Cepat (5 Kolom) */}
          <section className="lg:col-span-5 rounded-2xl border border-border bg-card p-6 sm:p-7 flex flex-col justify-between gap-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-forest">
                  <Gift className="w-3.5 h-3.5 text-gold" />
                  Program Referral
                </span>
                <span className="px-2.5 py-0.5 rounded-2xl bg-accent border border-gold/30 text-[11px] font-bold text-accent-foreground tabular-nums">
                  {referralInvitedCount} Teman Bergabung
                </span>
              </div>
              <h2 className="font-sans text-lg sm:text-xl font-bold text-foreground">
                Bagikan Kode &amp; Kumpulkan 250 Koin
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Teman Anda mendapat potongan langsung di transaksi pertama, dan Anda memperoleh{" "}
                <strong className="text-foreground">250 Koin (Rp25.000)</strong>.
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-4 h-12 rounded-2xl border border-dashed border-forest bg-forest-soft/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Kode Undangan
                </span>
                <span className="font-mono text-base font-bold tracking-widest text-forest select-all">
                  {referralCode}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyText(referralLink)}
                  className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-2xl border border-border bg-background hover:border-forest hover:bg-forest-soft text-xs font-bold text-foreground transition-colors cursor-pointer"
                >
                  {copiedCode === referralLink ? (
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
                  className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-2xl bg-gold hover:bg-gold-light text-secondary-foreground text-xs font-bold transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Bagikan Tautan</span>
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* ==========================================================
            TABS: KATALOG PENUKARAN | VOUCHER SAYA | RIWAYAT KOIN
           ========================================================== */}
        <section className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border bg-muted/30">
            <div
              role="tablist"
              aria-label="Navigasi halaman reward"
              className="flex items-center gap-1 overflow-x-auto no-scrollbar"
            >
              {[
                {
                  id: "katalog" as const,
                  label: "Tukar Koin ke Promo",
                  icon: Sparkles,
                  count: PROMO_CATALOG.length,
                },
                {
                  id: "voucher" as const,
                  label: "Voucher Aktif Saya",
                  icon: Ticket,
                  count: redeemedVouchers.length,
                },
                {
                  id: "riwayat" as const,
                  label: "Mutasi Koin",
                  icon: History,
                  count: coinHistory.length,
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
                    className={`px-3.5 py-3 text-xs font-bold whitespace-nowrap inline-flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
                      isActive
                        ? "border-forest text-forest"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
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

            {activeTab === "katalog" && (
              <div className="flex items-center gap-1.5 pb-3 sm:pb-2 overflow-x-auto no-scrollbar">
                {[
                  { id: "all" as const, label: "Semua" },
                  { id: "rental" as const, label: "Rental Gear" },
                  { id: "opentrip" as const, label: "Open Trip" },
                  { id: "shop" as const, label: "Toko" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-2xl text-[11px] font-bold border transition-colors cursor-pointer whitespace-nowrap ${
                      categoryFilter === cat.id
                        ? "bg-forest text-primary-foreground border-forest"
                        : "bg-background text-muted-foreground border-border hover:border-forest hover:text-foreground"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── TAB 1: KATALOG VOUCHER PROMO & CASHBACK ── */}
          {activeTab === "katalog" && (
            <div className="p-5 sm:p-6 bg-background">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPromos.map((promo) => {
                  const canRedeem = currentCoins >= promo.coinCost;
                  const CategoryIcon =
                    promo.category === "opentrip"
                      ? Mountain
                      : promo.category === "rental"
                        ? Tent
                        : Tag;

                  return (
                    <article
                      key={promo.id}
                      className="rounded-2xl border border-border bg-card flex flex-col justify-between overflow-hidden hover:border-forest transition-colors"
                    >
                      <div>
                        {/* Top Strip Kategori & Nilai Diskon */}
                        <div className="px-4 py-3 border-b border-border bg-forest-soft/50 flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-forest">
                            <CategoryIcon className="w-3.5 h-3.5" />
                            {promo.categoryLabel}
                          </span>
                          <span className="px-2 py-0.5 rounded-2xl bg-accent border border-gold/30 text-[10px] font-bold text-accent-foreground">
                            {promo.discountText}
                          </span>
                        </div>

                        <div className="p-4 space-y-2">
                          <h3 className="font-sans text-base font-bold text-foreground leading-snug">
                            {promo.title}
                          </h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {promo.description}
                          </p>
                          <div className="pt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground tabular-nums">
                            <span>
                              Min. transaksi{" "}
                              <strong className="text-foreground">
                                Rp{promo.minTransaction.toLocaleString("id-ID")}
                              </strong>
                            </span>
                            <span>•</span>
                            <span>Masa berlaku {promo.validDays} hari</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Penukaran Koin */}
                      <div className="px-4 py-3.5 border-t border-border bg-muted/30 flex items-center justify-between gap-3">
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Biaya Penukaran
                          </span>
                          <span className="font-sans text-sm font-bold text-gold tabular-nums">
                            {promo.coinCost.toLocaleString("id-ID")} Koin
                          </span>
                        </div>

                        <button
                          type="button"
                          disabled={!canRedeem}
                          onClick={() => setConfirmItem(promo)}
                          className={`px-4 h-9 rounded-2xl text-xs font-bold transition-colors ${
                            canRedeem
                              ? "bg-forest hover:bg-forest-dark text-primary-foreground cursor-pointer"
                              : "bg-muted text-muted-foreground border border-border cursor-not-allowed"
                          }`}
                        >
                          {canRedeem ? "Tukar Koin" : "Koin Kurang"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── TAB 2: VOUCHER AKTIF SAYA ── */}
          {activeTab === "voucher" && (
            <div className="p-5 sm:p-6 bg-background">
              {redeemedVouchers.length === 0 ? (
                <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-border bg-muted/20 space-y-3">
                  <Ticket className="w-8 h-8 text-muted-foreground mx-auto" />
                  <div className="space-y-1">
                    <h3 className="font-sans text-base font-bold text-foreground">
                      Belum Ada Voucher Aktif
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      Tukarkan saldo Habema Coin Anda pada tab katalog untuk mendapatkan kode potongan sewa alat maupun Open Trip.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("katalog")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-forest text-primary-foreground text-xs font-bold cursor-pointer"
                  >
                    <span>Lihat Katalog Promo</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {redeemedVouchers.map((voucher) => (
                    <div
                      key={voucher.voucherId}
                      className="p-4 rounded-2xl border border-forest/40 bg-forest-soft/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <span className="inline-block px-2 py-0.5 rounded-2xl bg-forest text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
                          {voucher.discountText}
                        </span>
                        <h3 className="font-sans text-sm sm:text-base font-bold text-foreground">
                          {voucher.title}
                        </h3>
                        <p className="text-[11px] text-muted-foreground tabular-nums">
                          Ditukar {voucher.redeemedAt} • Berlaku hingga{" "}
                          <strong className="text-foreground">{voucher.expiresAt}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-3 py-2 rounded-2xl border border-dashed border-forest bg-background font-mono text-xs font-bold text-forest">
                          {voucher.promoCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(voucher.promoCode)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-gold hover:bg-gold-light text-secondary-foreground text-xs font-bold cursor-pointer"
                        >
                          {copiedCode === voucher.promoCode ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Tersalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Salin</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 3: MUTASI KOIN ── */}
          {activeTab === "riwayat" && (
            <div className="p-5 sm:p-6 bg-background">
              {coinHistory.length === 0 ? (
                <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-border bg-muted/20 space-y-2">
                  <History className="w-7 h-7 text-muted-foreground mx-auto" />
                  <p className="font-sans text-sm font-bold text-foreground">
                    Belum Ada Riwayat Mutasi Koin
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Transaksi rental, belanja toko, atau undangan referral Anda akan tercatat otomatis di sini.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-border divide-y divide-border overflow-hidden">
                  {coinHistory.map((item) => (
                    <div
                      key={item.id}
                      className="px-4 py-3.5 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-foreground truncate">
                          {item.title}
                        </p>
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          {item.date}
                        </span>
                      </div>
                      <span
                        className={`text-xs sm:text-sm font-bold tabular-nums shrink-0 ${
                          item.type === "earn" ? "text-forest" : "text-gold"
                        }`}
                      >
                        {item.type === "earn" ? "+" : "-"}
                        {item.coins.toLocaleString("id-ID")} Koin
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Footer Jaminan Transparansi */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
          <ShieldCheck className="w-4 h-4 text-forest shrink-0" />
          <span>
            Kode promo hasil penukaran koin dapat langsung dimasukkan pada halaman checkout Rental Gear, Toko Outdoor, maupun reservasi Open Trip.
          </span>
        </div>
      </div>

      {/* ==========================================================
          MODAL KONFIRMASI PENUKARAN KOIN
         ========================================================== */}
      {confirmItem && (
        <div
          className="fixed inset-0 z-50 bg-foreground/70 flex items-center justify-center p-4"
          onClick={() => setConfirmItem(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-card overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-border bg-forest-soft">
              <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-forest">
                Konfirmasi Penukaran Koin
              </span>
              <h3 className="font-sans text-base font-bold text-foreground mt-0.5">
                {confirmItem.title}
              </h3>
            </div>

            <div className="p-5 space-y-4 bg-background text-xs">
              <p className="text-muted-foreground leading-relaxed">
                Saldo koin Anda akan dipotong sebesar{" "}
                <strong className="text-foreground tabular-nums">
                  {confirmItem.coinCost.toLocaleString("id-ID")} Koin
                </strong>{" "}
                dan kode promo <strong className="font-mono text-forest">{confirmItem.code}</strong> akan aktif selama {confirmItem.validDays} hari.
              </p>

              <div className="p-3.5 rounded-2xl border border-border bg-muted/40 space-y-1.5 tabular-nums">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Saldo Koin Saat Ini</span>
                  <span className="font-bold text-foreground">
                    {currentCoins.toLocaleString("id-ID")} Koin
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Biaya Penukaran</span>
                  <span className="font-bold text-gold">
                    -{confirmItem.coinCost.toLocaleString("id-ID")} Koin
                  </span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-border">
                  <span className="font-bold text-foreground">Sisa Saldo Koin</span>
                  <span className="font-bold text-forest">
                    {(currentCoins - confirmItem.coinCost).toLocaleString("id-ID")} Koin
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirmItem(null)}
                  className="flex-1 h-10 rounded-2xl border border-border bg-background hover:bg-muted text-xs font-bold text-foreground cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRedeem}
                  disabled={redeemLoading}
                  className="flex-1 h-10 rounded-2xl bg-gold hover:bg-gold-light text-secondary-foreground text-xs font-bold disabled:opacity-50 cursor-pointer"
                >
                  {redeemLoading ? "Memproses..." : "Tukar Sekarang"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}