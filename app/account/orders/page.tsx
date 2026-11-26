"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Package,
  Plus,
  ArrowLeft,
  Star,
  Truck,
  CreditCard,
  Search,
  X,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  ArrowUpDown,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { useAccountData } from "@/lib/account-data";
import { ShopOrderCard } from "@/components/account/shop-order-card";
import { EmptyState } from "@/components/account/empty-state";
import { ShopOrderCancelModal } from "@/components/account/modals";
import {
  DBShopOrder,
  formatCurrency,
} from "@/components/account/status-config";

type FilterKey =
  | "all"
  | "unpaid"
  | "processed"
  | "shipped"
  | "to-rate"
  | "done"
  | "cancelled";

type SortKey = "newest" | "oldest" | "highest" | "lowest";

const FILTERS: { key: FilterKey; label: string; icon: any }[] = [
  { key: "all", label: "Semua Pesanan", icon: Package },
  { key: "unpaid", label: "Belum Bayar", icon: CreditCard },
  { key: "processed", label: "Diproses", icon: Package },
  { key: "shipped", label: "Dikirim", icon: Truck },
  { key: "to-rate", label: "Beri Penilaian", icon: Star },
  { key: "done", label: "Selesai", icon: CheckCircle2 },
  { key: "cancelled", label: "Dibatalkan", icon: XCircle },
];

export default function OrdersHistoryPage() {
  const router = useRouter();
  const { shopOrders, reviewedEquipmentIds, loading, refetch } =
    useAccountData();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [cancelOrder, setCancelOrder] = useState<DBShopOrder | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Fungsi pencocokan status order
  const checkOrderCategory = useCallback(
    (o: DBShopOrder, targetFilter: FilterKey): boolean => {
      switch (targetFilter) {
        case "all":
          return true;
        case "unpaid":
          return o.payment_status === "pending";
        case "processed":
          return (
            o.status === "confirmed" && o.payment_status !== "cancelled"
          );
        case "shipped":
          return o.status === "shipped" && o.payment_status !== "cancelled";
        case "to-rate": {
          if (o.status !== "delivered") return false;
          const items = o.items || [];
          if (items.length === 0) return true;
          const reviewed = items.filter((i: any) =>
            reviewedEquipmentIds.includes(i.product_id)
          ).length;
          return reviewed < items.length;
        }
        case "done":
          return o.status === "delivered";
        case "cancelled":
          return o.status === "cancelled";
        default:
          return true;
      }
    },
    [reviewedEquipmentIds]
  );

  // Hitung badge jumlah pesanan per kategori status
  const filterCounts = useMemo(() => {
    const counts: Record<FilterKey, number> = {
      all: shopOrders.length,
      unpaid: 0,
      processed: 0,
      shipped: 0,
      "to-rate": 0,
      done: 0,
      cancelled: 0,
    };

    shopOrders.forEach((order) => {
      (
        [
          "unpaid",
          "processed",
          "shipped",
          "to-rate",
          "done",
          "cancelled",
        ] as FilterKey[]
      ).forEach((key) => {
        if (checkOrderCategory(order, key)) {
          counts[key] += 1;
        }
      });
    });

    return counts;
  }, [shopOrders, checkOrderCategory]);

  // Ringkasan pengeluaran & statistik belanja
  const summaryStats = useMemo(() => {
    const validOrders = shopOrders.filter(
      (o) => o.status !== "cancelled" && o.payment_status !== "cancelled"
    );
    const totalSpent = validOrders.reduce(
      (sum, o) => sum + Number(o.total_amount || 0),
      0
    );
    const activeProcessCount =
      filterCounts.unpaid + filterCounts.processed + filterCounts.shipped;

    return {
      totalOrders: shopOrders.length,
      totalSpent,
      activeProcessCount,
      toRateCount: filterCounts["to-rate"],
    };
  }, [shopOrders, filterCounts]);

  // Filter + Pencarian + Urutkan Pesanan
  const processedOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = shopOrders.filter((order) => {
      if (!checkOrderCategory(order, filter)) return false;

      if (!q) return true;

      const orderNumber = (
        order.order_id || `#${order.id.slice(0, 8)}`
      ).toLowerCase();
      const itemMatch = (order.items || []).some((item: any) =>
        String(item.name || "").toLowerCase().includes(q)
      );

      return (
        orderNumber.includes(q) ||
        order.id.toLowerCase().includes(q) ||
        itemMatch
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "newest") {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
      if (sortBy === "oldest") {
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }
      if (sortBy === "highest") {
        return Number(b.total_amount || 0) - Number(a.total_amount || 0);
      }
      return Number(a.total_amount || 0) - Number(b.total_amount || 0);
    });
  }, [shopOrders, filter, searchQuery, sortBy, checkOrderCategory]);

  const confirmCancel = useCallback(
    async (reason: string, note?: string) => {
      if (!cancelOrder) return;
      setCancelling(true);
      try {
        const res = await fetch("/api/shop-orders/cancel", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: cancelOrder.id,
            cancel_reason: reason,
            cancel_note: note,
          }),
        });
        const result = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(result?.error || "Gagal membatalkan order");
          return;
        }
        setCancelOrder(null);
        toast.success(result?.message || "Order berhasil dibatalkan");
        refetch();
      } catch {
        toast.error("Terjadi kesalahan.");
      } finally {
        setCancelling(false);
      }
    },
    [cancelOrder, refetch]
  );

  const hasActiveControls =
    filter !== "all" || searchQuery.trim() !== "" || sortBy !== "newest";

  const resetAllFilters = () => {
    setFilter("all");
    setSearchQuery("");
    setSortBy("newest");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3 px-6 py-5 rounded-2xl border border-border bg-card">
          <Loader2 className="w-6 h-6 animate-spin text-forest" />
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Memuat Riwayat Pesanan...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-body pb-16">
      {/* ==========================================
          1. TOP DISPATCH & NAVIGATION BAR
         ========================================== */}
      <div className="border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/account")}
              aria-label="Kembali ke Akun"
              className="w-9 h-9 rounded-2xl border border-border bg-background hover:border-forest hover:bg-forest-soft flex items-center justify-center text-foreground transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-sans text-lg sm:text-xl font-bold text-foreground tracking-tight">
                  Pesanan Saya
                </h1>
                <span className="px-2.5 py-0.5 rounded-2xl bg-forest-soft border border-forest/25 text-[11px] font-bold text-forest tabular-nums">
                  {shopOrders.length} Transaksi
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Pantau status pembayaran, pengiriman, hingga ulasan perlengkapan toko
              </p>
            </div>
          </div>

          <Link
            href="/catalog_shop"
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-2xl bg-gold hover:bg-gold-light text-secondary-foreground text-xs font-bold transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Belanja Perlengkapan</span>
          </Link>
        </div>
      </div>

      {/* ==========================================
          2. ASYMMETRIC TWO-COLUMN WORKSPACE (max-w-7xl)
         ========================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* ==========================================================
              KOLOM KIRI (4 KOLOM): RINGKASAN BELANJA & NAVIGASI STATUS
             ========================================================== */}
          <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-6">
            {/* Kartu Ringkasan Transaksi Toko */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 bg-forest text-primary-foreground border-b border-forest-dark flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-forest-tint">
                    Ikhtisar Belanja Toko
                  </span>
                  <h2 className="font-sans text-base font-bold text-primary-foreground mt-0.5">
                    Ringkasan Aktivitas
                  </h2>
                </div>
                <ShoppingBag className="w-5 h-5 text-forest-tint" />
              </div>

              <div className="p-5 space-y-4 bg-background">
                <div className="p-4 rounded-2xl border border-forest/25 bg-forest-soft/50">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-forest mb-1">
                    Total Belanja Berhasil
                  </span>
                  <span className="font-sans text-xl sm:text-2xl font-bold text-foreground tabular-nums">
                    {formatCurrency(summaryStats.totalSpent)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-2xl border border-border bg-muted/40">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                      Sedang Berjalan
                    </span>
                    <span className="font-bold text-sm text-foreground tabular-nums">
                      {summaryStats.activeProcessCount} Pesanan
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl border border-gold/35 bg-accent/45">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-accent-foreground mb-0.5">
                      Perlu Diulas
                    </span>
                    <span className="font-bold text-sm text-gold tabular-nums">
                      {summaryStats.toRateCount} Pesanan
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Daftar Filter Status Vertikal (Desktop) */}
            <div className="hidden lg:block rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border bg-background flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-forest">
                  Filter Status Pesanan
                </span>
                {filter !== "all" && (
                  <button
                    type="button"
                    onClick={() => setFilter("all")}
                    className="text-[11px] font-bold text-gold hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>

              <div className="p-2.5 bg-background space-y-1">
                {FILTERS.map((f) => {
                  const isSelected = filter === f.key;
                  const count = filterCounts[f.key];
                  return (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setFilter(f.key)}
                      className={`w-full px-3.5 py-2.5 rounded-2xl flex items-center justify-between text-xs font-bold transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-forest text-primary-foreground"
                          : "text-foreground/80 hover:bg-forest-soft/60 hover:text-forest"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <f.icon
                          className={`w-3.5 h-3.5 ${
                            isSelected ? "text-forest-tint" : "text-forest"
                          }`}
                        />
                        <span>{f.label}</span>
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-2xl text-[10px] tabular-nums ${
                          isSelected
                            ? "bg-forest-dark text-primary-foreground"
                            : count > 0 &&
                                (f.key === "unpaid" || f.key === "to-rate")
                              ? "bg-accent text-accent-foreground border border-gold/35"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* ==========================================================
              KOLOM KANAN (8 KOLOM): PENCARIAN, SORTIR & DAFTAR PESANAN
             ========================================================== */}
          <div className="lg:col-span-8 space-y-5">
            {/* Bar Kontrol: Pencarian + Sortir + Horizontal Pills Mobile */}
            <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Input Pencarian */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nomor pesanan atau nama produk..."
                    className="w-full h-10 pl-10 pr-9 rounded-2xl border border-input bg-background text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-forest transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label="Hapus pencarian"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Dropdown Urutkan */}
                <div className="relative sm:w-48 shrink-0">
                  <ArrowUpDown className="w-3.5 h-3.5 text-forest absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortKey)}
                    aria-label="Urutkan pesanan"
                    className="w-full h-10 pl-9 pr-3 rounded-2xl border border-input bg-background text-xs font-bold text-foreground focus:outline-none focus:border-forest transition-colors cursor-pointer"
                  >
                    <option value="newest">Terbaru</option>
                    <option value="oldest">Terlama</option>
                    <option value="highest">Nominal Tertinggi</option>
                    <option value="lowest">Nominal Terendah</option>
                  </select>
                </div>
              </div>

              {/* Filter Pills Horizontal (Tampil di Mobile & Tablet) */}
              <div className="flex lg:hidden gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {FILTERS.map((f) => {
                  const isSelected = filter === f.key;
                  const count = filterCounts[f.key];
                  return (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setFilter(f.key)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-2xl border whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                        isSelected
                          ? "bg-forest text-primary-foreground border-forest"
                          : "bg-background text-foreground/80 border-border hover:border-forest"
                      }`}
                    >
                      <f.icon className="w-3.5 h-3.5" />
                      <span>{f.label}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-2xl text-[10px] tabular-nums ${
                          isSelected
                            ? "bg-forest-dark text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Info Hasil Filter Aktif */}
              <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-muted-foreground tabular-nums">
                  Menampilkan{" "}
                  <strong className="text-foreground">
                    {processedOrders.length}
                  </strong>{" "}
                  dari {shopOrders.length} pesanan
                </span>

                {hasActiveControls && (
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="inline-flex items-center gap-1.5 font-bold text-forest hover:text-forest-dark transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Atur Ulang Filter</span>
                  </button>
                )}
              </div>
            </section>

            {/* Banner Pengingat Penilaian (Muncul jika ada pesanan siap diulas) */}
            {summaryStats.toRateCount > 0 && filter !== "to-rate" && (
              <div className="p-4 rounded-2xl border border-gold/40 bg-accent/55 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-gold text-secondary-foreground flex items-center justify-center shrink-0">
                    <Star className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-foreground">
                      Ada {summaryStats.toRateCount} pesanan yang sudah diterima &amp; siap diulas
                    </p>
                    <p className="text-accent-foreground/85 mt-0.5">
                      Bagikan pengalaman pemakaian perlengkapan Anda untuk membantu pendaki lainnya.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFilter("to-rate")}
                  className="px-4 h-9 rounded-2xl bg-forest hover:bg-forest-dark text-primary-foreground text-xs font-bold transition-colors shrink-0 cursor-pointer"
                >
                  Lihat Pesanan
                </button>
              </div>
            )}

            {/* Daftar Kartu Pesanan atau Empty State */}
            {processedOrders.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card">
                <EmptyState
                  icon={Package}
                  title={
                    hasActiveControls
                      ? "Pesanan tidak ditemukan"
                      : "Belum ada pesanan toko"
                  }
                  desc={
                    hasActiveControls
                      ? "Coba ubah kata kunci pencarian atau pilih kategori status lain untuk melihat riwayat transaksi Anda."
                      : "Order perlengkapan outdoor yang telah Anda checkout akan tampil lengkap di halaman ini."
                  }
                  action={
                    hasActiveControls ? (
                      <button
                        type="button"
                        onClick={resetAllFilters}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-primary-foreground bg-forest rounded-2xl hover:bg-forest-dark transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Tampilkan Semua Pesanan</span>
                      </button>
                    ) : (
                      <Link href="/catalog_shop">
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-secondary-foreground bg-gold rounded-2xl hover:bg-gold-light transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Belanja Sekarang</span>
                        </button>
                      </Link>
                    )
                  }
                />
              </div>
            ) : (
              <div className="space-y-3.5">
                {processedOrders.map((order) => (
                  <ShopOrderCard
                    key={order.id}
                    order={order}
                    onDetail={() => router.push(`/account/orders/${order.id}`)}
                    onCancel={() => setCancelOrder(order)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <ShopOrderCancelModal
        order={cancelOrder}
        onClose={() => setCancelOrder(null)}
        onConfirm={confirmCancel}
        busy={cancelling}
      />
    </div>
  );
}