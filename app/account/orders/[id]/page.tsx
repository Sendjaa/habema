"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2,
  ArrowLeft,
  Package,
  Receipt,
  ShieldCheck,
  AlertCircle,
  CreditCard,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAccountData } from "@/lib/account-data";
import {
  SHOP_STATUS_CONFIG,
  SHOP_PAYMENT_CONFIG,
  formatCurrency,
  formatDate,
} from "@/components/account/status-config";
import { ShopOrderCancelModal } from "@/components/account/modals";

export default function ShopOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const { shopOrders, loading, refetch } = useAccountData();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const order = shopOrders.find((o) => o.id === id) || null;

  const confirmCancel = useCallback(
    async (reason: string, note?: string) => {
      if (!order) return;
      setCancelling(true);
      try {
        const res = await fetch("/api/shop-orders/cancel", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: order.id,
            cancel_reason: reason,
            cancel_note: note,
          }),
        });
        const result = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(result?.error || "Gagal membatalkan order");
          return;
        }
        toast.success(result?.message || "Order berhasil dibatalkan");
        refetch();
      } catch {
        toast.error("Terjadi kesalahan.");
      } finally {
        setCancelling(false);
        setCancelOpen(false);
      }
    },
    [order, refetch]
  );

  // Mapping badge agar tetap patuh pada Strict 3-Color Rule (forest, gold, stone)
  const getOrderBadgeStyle = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-accent text-accent-foreground border border-gold/40";
      case "confirmed":
      case "processing":
        return "bg-forest-soft text-forest border border-forest/30";
      case "shipped":
        return "bg-forest text-primary-foreground border border-forest-dark";
      case "delivered":
      case "completed":
        return "bg-forest-soft text-forest-dark border border-forest/25";
      case "cancelled":
      case "refunded":
      case "expired":
        return "bg-destructive/10 text-destructive border border-destructive/30";
      default:
        return "bg-muted text-muted-foreground border border-border";
    }
  };

  const getPaymentBadgeStyle = (paymentStatus: string) => {
    switch (paymentStatus) {
      case "paid":
      case "settlement":
      case "capture":
        return "bg-forest-soft text-forest border border-forest/30";
      case "pending":
        return "bg-accent text-accent-foreground border border-gold/40";
      case "cancelled":
      case "refunded":
      case "expired":
      case "failed":
        return "bg-destructive/10 text-destructive border border-destructive/30";
      default:
        return "bg-muted text-muted-foreground border border-border";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3 px-6 py-5 rounded-2xl border border-border bg-card">
          <Loader2 className="w-6 h-6 animate-spin text-forest" />
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Memuat Detail Pesanan...
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 font-body">
        <div className="p-8 rounded-2xl border border-border bg-card max-w-md w-full text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto text-muted-foreground">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="font-sans text-lg font-bold text-foreground">
            Pesanan tidak ditemukan
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Pesanan yang Anda cari tidak tersedia atau Anda tidak memiliki akses ke dokumen ini.
          </p>
          <button
            type="button"
            onClick={() => router.push("/account/orders")}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-forest hover:bg-forest-dark text-primary-foreground text-xs font-bold px-5 h-10 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Daftar Pesanan</span>
          </button>
        </div>
      </div>
    );
  }

  const sc = SHOP_STATUS_CONFIG[order.status] ?? {
    label: order.status,
    dot: "bg-foreground",
  };
  const pc = SHOP_PAYMENT_CONFIG[order.payment_status] ?? {
    label: order.payment_status,
  };

  const canCancel =
    !["cancelled", "delivered", "refunded", "expired"].includes(order.status) &&
    !["cancelled", "refunded", "expired"].includes(order.payment_status);

  const totalItemQty = (order.items || []).reduce(
    (sum: number, item: any) => sum + Number(item.quantity || 0),
    0
  );

  const displayOrderNumber =
    order.order_id || `#${order.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-background text-foreground font-body pb-16">
      {/* ==========================================
          1. TOP DISPATCH & NAVIGATION BAR
         ========================================== */}
      <div className="border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/account/orders")}
              aria-label="Kembali ke Pesanan"
              className="w-9 h-9 rounded-2xl border border-border bg-background hover:border-forest hover:bg-forest-soft flex items-center justify-center text-foreground transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-sans text-lg sm:text-xl font-bold text-foreground tracking-tight">
                  Detail Pesanan Toko
                </h1>
                <span className="px-2.5 py-0.5 rounded-2xl bg-muted border border-border text-[11px] font-mono font-bold text-foreground">
                  {displayOrderNumber}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDate(order.created_at)}
                {order.payment_method ? ` · ${order.payment_method}` : ""}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-2xl text-xs font-bold ${getOrderBadgeStyle(
                order.status
              )}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span>{sc.label}</span>
            </span>

            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-2xl text-xs font-bold ${getPaymentBadgeStyle(
                order.payment_status
              )}`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{pc.label}</span>
            </span>
          </div>
        </div>
      </div>

      {/* ==========================================
          2. MAIN TWO-COLUMN WORKSPACE (max-w-7xl)
         ========================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* ==========================================================
              KOLOM KIRI (7 KOLOM): DAFTAR BARANG & STATUS PEMBATALAN
             ========================================================== */}
          <div className="lg:col-span-7 space-y-6">
            {/* Daftar Barang Pesanan */}
            <section className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border bg-background flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-forest" />
                  <h2 className="font-sans text-sm sm:text-base font-bold text-foreground">
                    Barang Dipesan
                  </h2>
                </div>
                <span className="px-2.5 py-0.5 rounded-2xl bg-forest-soft border border-forest/25 text-[11px] font-bold text-forest tabular-nums">
                  {totalItemQty} Item
                </span>
              </div>

              {!order.items || order.items.length === 0 ? (
                <div className="p-8 text-center bg-background text-xs text-muted-foreground">
                  Tidak ada item pada pesanan ini.
                </div>
              ) : (
                <div className="divide-y divide-border bg-background">
                  {order.items.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {item.product?.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.product.image_url}
                            alt={item.name}
                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border border-border object-cover shrink-0 bg-muted"
                          />
                        ) : (
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border border-border bg-muted/60 flex items-center justify-center text-muted-foreground shrink-0">
                            <Package className="w-5 h-5" />
                          </div>
                        )}

                        <div className="min-w-0 space-y-1">
                          <h3 className="font-sans text-sm sm:text-base font-bold text-foreground truncate">
                            {item.name}
                          </h3>
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {formatCurrency(item.price)} × {item.quantity} unit
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Subtotal
                        </span>
                        <p className="font-sans text-sm sm:text-base font-bold text-foreground tabular-nums">
                          {formatCurrency(item.total)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Alasan Pembatalan (Bila Dibatalkan) */}
            {order.status === "cancelled" &&
              (order.cancel_reason || order.cancel_note) && (
                <section className="rounded-2xl border border-destructive/30 bg-destructive/5 overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-destructive/20 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    <h2 className="font-sans text-sm font-bold text-destructive">
                      Alasan Pembatalan
                    </h2>
                  </div>
                  <div className="p-5 space-y-1.5">
                    {order.cancel_reason && (
                      <p className="text-sm font-bold text-destructive">
                        {order.cancel_reason}
                      </p>
                    )}
                    {order.cancel_note && (
                      <p className="text-xs sm:text-sm text-destructive/85 leading-relaxed">
                        {order.cancel_note}
                      </p>
                    )}
                  </div>
                </section>
              )}
          </div>

          {/* ==========================================================
              KOLOM KANAN (5 KOLOM): RINGKASAN BIAYA & AKSI BATALKAN
             ========================================================== */}
          <aside className="lg:col-span-5 lg:sticky lg:top-6">
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {/* Header Solid Forest */}
              <div className="px-6 py-4 bg-forest text-primary-foreground border-b border-forest-dark flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-forest-tint">
                    Ringkasan Tagihan
                  </span>
                  <h2 className="font-sans text-base font-bold text-primary-foreground mt-0.5">
                    Rincian Biaya Pesanan
                  </h2>
                </div>
                <Receipt className="w-5 h-5 text-forest-tint" />
              </div>

              <div className="p-6 space-y-5 bg-background">
                {/* Breakdown Angka */}
                <div className="space-y-3 text-xs sm:text-sm tabular-nums">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal Produk</span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(order.subtotal)}
                    </span>
                  </div>

                  {Number(order.discount_amount) > 0 && (
                    <div className="flex justify-between text-forest font-semibold">
                      <span>Diskon</span>
                      <span>-{formatCurrency(order.discount_amount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-muted-foreground">
                    <span>Ongkos Kirim</span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(order.delivery_cost)}
                    </span>
                  </div>

                  <div className="pt-3.5 border-t border-border flex items-baseline justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Total Pembayaran
                    </span>
                    <span className="font-sans text-2xl font-bold text-forest">
                      {formatCurrency(order.total_amount)}
                    </span>
                  </div>
                </div>

                {/* Tombol Batalkan Pesanan */}
                {canCancel && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setCancelOpen(true)}
                      className="w-full h-11 rounded-2xl border border-destructive/35 bg-destructive/5 hover:bg-destructive hover:text-destructive-foreground text-destructive font-bold text-xs uppercase tracking-[0.12em] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Batalkan Pesanan</span>
                    </button>
                  </div>
                )}

                <div className="p-3.5 rounded-2xl border border-border bg-muted/35 flex items-start gap-2.5 text-[11px] text-muted-foreground leading-relaxed">
                  <ShieldCheck className="w-4 h-4 text-forest shrink-0 mt-0.5" />
                  <span>
                    Simpan nomor pesanan{" "}
                    <strong className="font-mono text-foreground">
                      {displayOrderNumber}
                    </strong>{" "}
                    sebagai referensi konfirmasi pembayaran maupun pelacakan pengiriman.
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <ShopOrderCancelModal
        order={cancelOpen ? order : null}
        onClose={() => setCancelOpen(false)}
        onConfirm={confirmCancel}
        busy={cancelling}
      />
    </div>
  );
}