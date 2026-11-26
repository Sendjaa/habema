"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  Check,
  Loader2,
  MapPin,
  MessageCircle,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { DateRangePicker } from "@/components/booking/date-range-picker";
import { calculateDaysBetween } from "@/lib/booking-utils";
import { toast } from "sonner";

type BundleDetail = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  bundle_price: number;
  original_price: number | null;
  discount_percentage: number | null;
  image_url: string | null;
  paxMin: number | null;
  paxMax: number | null;
  paxLabel: string | null;
  pricePerNight: number;
  unit: string;
  include: string[];
  exclude: string[];
  items: {
    equipment_id: string;
    name: string;
    quantity: number;
    price_per_night: number;
    image_url: string | null;
  }[];
  hasStockLink: boolean;
};

const formatRp = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

export default function PackageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray((params as any)?.id)
    ? (params as any).id[0]
    : (params as any)?.id;

  const [bundle, setBundle] = useState<BundleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [qty, setQty] = useState(1);
  const [branches, setBranches] = useState<any[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [pickupBranchId, setPickupBranchId] = useState<string | null>(null);
  const [branchPhone, setBranchPhone] = useState("6283898749357");
  const [activeTab, setActiveTab] = useState<"kelengkapan" | "manifest">("kelengkapan");

  // ── 1. Fetch Detail Paket Bundling ──
  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/bundles/${id}`);
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Paket tidak ditemukan");
        }
        setBundle(json.data);
      } catch (e: any) {
        toast.error(e?.message || "Gagal memuat paket");
        setBundle(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // ── 2. Fetch Nomor WhatsApp Cabang Utama ──
  useEffect(() => {
    const fetchPhone = async () => {
      try {
        const res = await fetch("/api/branches");
        const json = await res.json().catch(() => ({}));
        const phone = json?.data?.[0]?.phone;
        if (phone) {
          const cleaned = String(phone).replace(/[^0-9]/g, "");
          setBranchPhone(
            cleaned.startsWith("0")
              ? "62" + cleaned.slice(1)
              : cleaned.startsWith("62")
                ? cleaned
                : "62" + cleaned
          );
        }
      } catch {}
    };
    fetchPhone();
  }, []);

  // ── 3. Cek Ketersediaan Stok Paket per Cabang ──
  useEffect(() => {
    const loadBranches = async () => {
      if (!bundle) return;
      try {
        setLoadingBranches(true);
        const sp = new URLSearchParams({
          bundleId: bundle.id,
          bundleQty: String(qty),
        });
        if (startDate && endDate) {
          sp.set("startDate", startDate.toISOString());
          sp.set("endDate", endDate.toISOString());
        }
        const res = await fetch(`/api/branches/availability?${sp.toString()}`);
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.success) {
          setBranches(json.data || []);
          setPickupBranchId((prev) => prev || (json.data || [])[0]?.id || null);
        }
      } catch {
        setBranches([]);
      } finally {
        setLoadingBranches(false);
      }
    };
    loadBranches();
  }, [bundle, startDate, endDate, qty]);

  const days = useMemo(
    () =>
      startDate && endDate
        ? Math.max(1, calculateDaysBetween(startDate, endDate))
        : 0,
    [startDate, endDate]
  );

  const total = useMemo(
    () => (bundle ? Number(bundle.pricePerNight || 0) * (days || 0) * qty : 0),
    [bundle, days, qty]
  );

  const retailEquivalent = useMemo(
    () =>
      bundle && bundle.original_price
        ? Number(bundle.original_price) * (days || 0) * qty
        : 0,
    [bundle, days, qty]
  );

  const pickupBranch =
    branches.find((b: any) => b.id === pickupBranchId) || null;

  const handleBooking = () => {
    if (!bundle) return;
    if (!startDate || !endDate) {
      toast.error("Pilih tanggal sewa dulu");
      return;
    }
    if (!pickupBranchId) {
      toast.error("Pilih cabang pengambilan dulu");
      return;
    }
    const sp = new URLSearchParams({
      type: "bundle",
      id: bundle.id,
      quantity: String(qty),
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10),
    });
    router.push(`/booking?${sp.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3 px-6 py-5 rounded-2xl border border-border bg-card">
          <Loader2 className="w-6 h-6 animate-spin text-forest" />
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Memuat Detail Paket...
          </p>
        </div>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-center px-4 font-body">
        <div className="p-8 rounded-2xl border border-border bg-card max-w-md w-full space-y-3">
          <p className="font-sans text-lg font-bold text-foreground">
            Paket tidak ditemukan
          </p>
          <p className="text-xs text-muted-foreground">
            Paket bundling yang Anda cari mungkin sudah tidak tersedia atau tautan berubah.
          </p>
          <Link
            href="/packages"
            className="inline-flex items-center justify-center gap-2 px-5 h-10 rounded-2xl bg-forest text-primary-foreground text-xs font-bold mt-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Daftar Paket</span>
          </Link>
        </div>
      </div>
    );
  }

  const waText = encodeURIComponent(
    `Halo Habema Outdoor, saya tertarik dengan ${bundle.name} (${
      bundle.paxLabel || "paket grup"
    })`
  );

  const totalUnitCount = bundle.items.reduce(
    (acc, item) => acc + Number(item.quantity || 0),
    0
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-body pb-20">
      {/* ==========================================
          1. TOP DISPATCH & BREADCRUMB BAR
         ========================================== */}
      <div className="border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2">
            <Link
              href="/packages"
              className="inline-flex items-center gap-1.5 font-bold text-forest hover:text-forest-dark transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Semua Paket</span>
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-semibold text-foreground truncate max-w-[200px] sm:max-w-none">
              {bundle.name}
            </span>
          </nav>

          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
            <span className="px-2.5 py-0.5 rounded-2xl bg-forest-soft border border-forest/25 text-forest">
              {bundle.category}
            </span>
            {bundle.discount_percentage ? (
              <span className="px-2.5 py-0.5 rounded-2xl bg-accent border border-gold/40 text-accent-foreground tabular-nums">
                Hemat {bundle.discount_percentage}%
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* ==========================================
          2. MAIN TWO-COLUMN WORKSPACE (max-w-7xl)
         ========================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* ==========================================================
              KOLOM KIRI (7 KOLOM): VISUAL PAKET, HARGA & MANIFEST ALAT
             ========================================================== */}
          <div className="lg:col-span-7 space-y-6">
            {/* Kartu Hero Visual & Ringkasan */}
            <section className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="relative h-64 sm:h-80 md:h-96 bg-muted border-b border-border overflow-hidden">
                <Image
                  src={bundle.image_url || "/images/bannerImage.webp"}
                  alt={bundle.name}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-2xl bg-forest text-primary-foreground text-[11px] font-bold uppercase tracking-wider">
                    {bundle.category}
                  </span>
                  {bundle.paxLabel && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-2xl bg-background/95 border border-border text-[11px] font-bold text-foreground">
                      <Users className="w-3.5 h-3.5 text-forest" />
                      {bundle.paxLabel}
                    </span>
                  )}
                </div>
              </div>

              {/* Informasi Judul, Deskripsi & Tarif Dasar */}
              <div className="p-6 sm:p-7 bg-background space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-border">
                  <div className="space-y-1.5 max-w-xl">
                    <h1 className="font-sans text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-snug">
                      {bundle.name}
                    </h1>
                    {bundle.paxLabel && (
                      <p className="text-xs font-semibold text-forest">
                        {bundle.paxLabel} · Harga per paket per malam
                      </p>
                    )}
                    {bundle.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
                        {bundle.description}
                      </p>
                    )}
                  </div>

                  {/* Blok Harga Satuan */}
                  <div className="sm:text-right shrink-0 p-3.5 rounded-2xl border border-forest/25 bg-forest-soft/60">
                    <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-forest">
                      Tarif Sewa Paket
                    </span>
                    <div className="flex sm:justify-end items-baseline gap-1 mt-0.5">
                      <span className="font-sans text-2xl font-bold text-foreground tabular-nums">
                        {formatRp(Number(bundle.pricePerNight))}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">
                        /paket/malam
                      </span>
                    </div>
                    {bundle.original_price ? (
                      <span className="block text-xs text-muted-foreground line-through tabular-nums mt-0.5">
                        {formatRp(Number(bundle.original_price))}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Strip Parameter Standar */}
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-2xl border border-border bg-muted/40">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                      Kapasitas Paket
                    </span>
                    <span className="font-bold text-foreground">
                      {bundle.paxLabel || "Grup Standar"}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl border border-border bg-muted/40">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                      Komponen Alat
                    </span>
                    <span className="font-bold text-foreground tabular-nums">
                      {totalUnitCount > 0
                        ? `${totalUnitCount} Unit Alat`
                        : `${bundle.include.length} Kelengkapan`}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl border border-border bg-muted/40">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                      Verifikasi Stok
                    </span>
                    <span className="font-bold text-forest">Otomatis per Cabang</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Modul Tab Kelengkapan (Include/Exclude vs Rincian Alat Stok) */}
            <section className="rounded-2xl border border-border bg-card overflow-hidden">
              <div
                role="tablist"
                aria-label="Detail isi paket bundling"
                className="flex items-center gap-1 px-4 border-b border-border bg-muted/30"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "kelengkapan"}
                  onClick={() => setActiveTab("kelengkapan")}
                  className={`px-3.5 py-3.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                    activeTab === "kelengkapan"
                      ? "border-forest text-forest"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Include &amp; Exclude Paket
                </button>

                {bundle.items.length > 0 && (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "manifest"}
                    onClick={() => setActiveTab("manifest")}
                    className={`px-3.5 py-3.5 text-xs font-bold inline-flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
                      activeTab === "manifest"
                        ? "border-forest text-forest"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>Rincian Alat ({qty} Paket)</span>
                    <span className="px-1.5 py-0.5 rounded-2xl bg-forest text-primary-foreground text-[10px] tabular-nums">
                      {bundle.items.length}
                    </span>
                  </button>
                )}
              </div>

              <div className="p-6 bg-background">
                {activeTab === "kelengkapan" || bundle.items.length === 0 ? (
                  <div
                    className={`grid grid-cols-1 ${
                      bundle.exclude.length > 0 ? "md:grid-cols-2" : ""
                    } gap-5`}
                  >
                    {/* Include */}
                    <div className="p-4 rounded-2xl border border-forest/30 bg-forest-soft/50 space-y-3">
                      <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-forest">
                        Include (Termasuk Dalam Paket)
                      </span>
                      <ul className="space-y-2.5">
                        {bundle.include.map((it) => (
                          <li
                            key={it}
                            className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground leading-snug"
                          >
                            <Check className="w-4 h-4 text-forest shrink-0 mt-0.5" />
                            <span>{it}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Exclude */}
                    {bundle.exclude.length > 0 && (
                      <div className="p-4 rounded-2xl border border-border bg-muted/35 space-y-3">
                        <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                          Exclude (Tidak Termasuk)
                        </span>
                        <ul className="space-y-2.5">
                          {bundle.exclude.map((it) => (
                            <li
                              key={it}
                              className="flex items-start gap-2.5 text-xs sm:text-sm text-muted-foreground leading-snug"
                            >
                              <X className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                              <span>{it}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-border divide-y divide-border overflow-hidden">
                      {bundle.items.map((it, idx) => (
                        <div
                          key={it.equipment_id}
                          className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-6 h-6 rounded-2xl bg-forest-soft border border-forest/20 text-[10px] font-bold text-forest flex items-center justify-center tabular-nums shrink-0">
                              0{idx + 1}
                            </span>
                            <span className="text-xs sm:text-sm font-semibold text-foreground truncate">
                              {it.name}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-forest tabular-nums shrink-0">
                            ×{it.quantity * qty}{" "}
                            <span className="font-normal text-muted-foreground">
                              per booking
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Stok dicek otomatis per cabang saat booking.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* ==========================================================
              KOLOM KANAN (5 KOLOM): PANEL KONFIGURASI SEWA & STOK CABANG
             ========================================================== */}
          <aside className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {/* Header Panel Solid Forest */}
              <div className="px-6 py-4 bg-forest text-primary-foreground border-b border-forest-dark flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-forest-tint">
                    Konfigurasi Penyewaan
                  </span>
                  <h2 className="font-sans text-base font-bold text-primary-foreground mt-0.5">
                    Jadwal &amp; Lokasi Ambil
                  </h2>
                </div>
                <Package className="w-5 h-5 text-forest-tint" />
              </div>

              <div className="p-6 space-y-5 bg-background">
                {/* 1. Tanggal Sewa (DateRangePicker) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-forest" />
                      <span>Tanggal sewa</span>
                    </span>
                    {days > 0 && (
                      <span className="px-2.5 py-0.5 rounded-2xl bg-forest-soft border border-forest/25 text-[11px] font-bold text-forest tabular-nums">
                        Durasi: {days} hari
                      </span>
                    )}
                  </div>

                  <DateRangePicker
                    onDateRangeSelect={(s: Date, e: Date) => {
                      setStartDate(s);
                      setEndDate(e);
                    }}
                    selectedStartDate={startDate || undefined}
                    selectedEndDate={endDate || undefined}
                  />
                </div>

                {/* 2. Jumlah Paket */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Jumlah paket
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Maks. 10 paket/booking
                    </span>
                  </div>

                  <div className="flex items-center justify-between h-11 px-3 rounded-2xl border border-border bg-muted/30">
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      disabled={qty <= 1}
                      aria-label="Kurangi"
                      className="w-8 h-8 rounded-2xl border border-border bg-background hover:border-forest hover:text-forest flex items-center justify-center disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm font-bold text-foreground tabular-nums">
                      {qty} Paket
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.min(10, q + 1))}
                      disabled={qty >= 10}
                      aria-label="Tambah"
                      className="w-8 h-8 rounded-2xl border border-border bg-background hover:border-forest hover:text-forest flex items-center justify-center disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 3. Cabang Pengambilan */}
                <div className="space-y-2">
                  <span className="block text-xs font-bold uppercase tracking-wider text-foreground">
                    Cabang pengambilan
                  </span>

                  {loadingBranches ? (
                    <div className="p-3.5 rounded-2xl border border-border bg-muted/30 text-xs text-muted-foreground flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-forest" />
                      <span>Mengecek stok paket...</span>
                    </div>
                  ) : branches.length === 0 ? (
                    <p className="text-xs text-accent-foreground bg-accent border border-gold/40 rounded-2xl p-3.5">
                      Stok paket tidak tersedia. Coba tanggal/qty lain.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {branches.map((b: any) => {
                        const packs = b.packageStock ?? b.stock ?? 0;
                        const selected = pickupBranchId === b.id;
                        const disabled = b.hasStockLink !== false && packs < 1;

                        return (
                          <button
                            key={b.id}
                            type="button"
                            disabled={disabled}
                            onClick={() => setPickupBranchId(b.id)}
                            className={`w-full p-3.5 rounded-2xl border text-left transition-colors ${
                              selected
                                ? "border-forest bg-forest-soft/60"
                                : "border-border bg-background hover:border-forest/50"
                            } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2.5 min-w-0">
                                <MapPin
                                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                                    selected ? "text-forest" : "text-muted-foreground"
                                  }`}
                                />
                                <div className="min-w-0">
                                  <p className="text-xs sm:text-sm font-bold text-foreground truncate">
                                    {b.name}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground">
                                    {b.address}
                                    {b.city ? `, ${b.city}` : ""}
                                  </p>
                                </div>
                              </div>

                              <span
                                className={`px-2 py-0.5 rounded-2xl text-[10px] font-bold shrink-0 tabular-nums ${
                                  disabled
                                    ? "bg-muted text-muted-foreground"
                                    : selected
                                      ? "bg-forest text-primary-foreground"
                                      : "bg-forest-soft text-forest border border-forest/20"
                                }`}
                              >
                                {b.hasStockLink === false
                                  ? "Bisa dipesan"
                                  : disabled
                                    ? "Habis"
                                    : `Bisa ${packs} paket`}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 4. Ringkasan Kalkulasi Biaya */}
                <div className="p-4 rounded-2xl border border-border bg-muted/40 space-y-2 text-xs">
                  <div className="flex justify-between text-muted-foreground tabular-nums">
                    <span>
                      {formatRp(Number(bundle.pricePerNight))} × {days || 0} hari ×{" "}
                      {qty} paket
                    </span>
                    <span className="font-semibold text-foreground">
                      {days > 0 ? formatRp(total) : "—"}
                    </span>
                  </div>

                  {days > 0 && retailEquivalent > total && (
                    <div className="flex justify-between text-forest font-semibold tabular-nums">
                      <span>Hemat dibandingkan satuan</span>
                      <span>-{formatRp(retailEquivalent - total)}</span>
                    </div>
                  )}

                  <div className="pt-2.5 border-t border-border flex items-baseline justify-between">
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Total
                      </span>
                      {pickupBranch && (
                        <span className="block text-[11px] text-muted-foreground mt-0.5">
                          Ambil di: {pickupBranch.name}
                        </span>
                      )}
                    </div>
                    <span className="font-sans text-xl sm:text-2xl font-bold text-forest tabular-nums">
                      {days > 0 ? formatRp(total) : "—"}
                    </span>
                  </div>
                </div>

                {/* 5. Tombol Aksi Utama & WhatsApp */}
                <div className="space-y-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleBooking}
                    disabled={!startDate || !endDate || !pickupBranchId}
                    className="w-full h-12 rounded-2xl bg-gold hover:bg-gold-light text-secondary-foreground font-bold text-xs uppercase tracking-[0.14em] flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>Booking Sekarang</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>

                  <a
                    href={`https://wa.me/${branchPhone}?text=${waText}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-11 rounded-2xl border border-border bg-background hover:border-forest hover:bg-forest-soft text-xs font-bold text-foreground flex items-center justify-center gap-2 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 text-forest" />
                    <span>Tanya via WhatsApp</span>
                  </a>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1">
                  <ShieldCheck className="w-4 h-4 text-forest shrink-0" />
                  <span>
                    Stok unit otomatis terkunci setelah konfirmasi booking selesai.
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}