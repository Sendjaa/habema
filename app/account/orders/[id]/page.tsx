"use client";
import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Package } from "lucide-react";
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

  const confirmCancel = useCallback(async (reason: string, note?: string) => {
    if (!order) return;
    setCancelling(true);
    try {
      const res = await fetch("/api/shop-orders/cancel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: order.id, cancel_reason: reason, cancel_note: note }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(result?.error || "Gagal membatalkan order"); return; }
      toast.success(result?.message || "Order berhasil dibatalkan");
      refetch();
    } catch {
      toast.error("Terjadi kesalahan.");
    } finally {
      setCancelling(false);
      setCancelOpen(false);
    }
  }, [order, refetch]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#F7F7F5]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <button
            onClick={() => router.push("/account/orders")}
            className="flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-700 mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Detail Pesanan
          </button>
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mb-4">
              <Package className="w-7 h-7 text-stone-400" />
            </div>
            <h3 className="text-sm font-semibold text-stone-700 mb-1">Pesanan tidak ditemukan</h3>
            <p className="text-xs text-stone-400 mb-5 max-w-xs">Pesanan yang Anda cari tidak tersedia.</p>
          </div>
        </div>
      </div>
    );
  }

  const sc = SHOP_STATUS_CONFIG[order.status] ?? { color: "text-stone-700", bg: "bg-stone-100 border-stone-200", dot: "bg-stone-400" };
  const pc = SHOP_PAYMENT_CONFIG[order.payment_status] ?? { color: "text-stone-700", bg: "bg-stone-100 border-stone-200" };
  const canCancel = !["cancelled", "delivered", "refunded", "expired"].includes(order.status)
    && !["cancelled", "refunded", "expired"].includes(order.payment_status);

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      {/* Header */}
      <div className="bg-white border-b border-stone-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <button
            onClick={() => router.push("/account/orders")}
            className="flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-700 mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Pesanan
          </button>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${sc.bg} ${sc.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                  {sc.label}
                </span>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${pc.bg} ${pc.color}`}>
                  {pc.label}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-stone-900">
                {order.order_id || ('#' + order.id.slice(0, 8).toUpperCase())}
              </h1>
              <p className="text-sm text-stone-500 mt-0.5">
                {formatDate(order.created_at)}
                {order.payment_method ? ` · ${order.payment_method}` : ''}
              </p>
            </div>
            {canCancel && (
              <button
                onClick={() => setCancelOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
              >
                Batalkan
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="max-w-3xl space-y-5">
          {/* Items */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 sm:p-6">
            <h4 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-3">Barang</h4>
            <div className="space-y-2">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex items-center gap-3 p-2.5 bg-stone-50 rounded-xl">
                  {item.product?.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.product.image_url} alt={item.name}
                      className="w-10 h-10 object-cover rounded-lg border border-stone-200 shrink-0" />
                  ) : (
                    <div className="w-10 h-10 bg-stone-100 rounded-lg border border-stone-200 flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4 text-stone-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-stone-800 line-clamp-1">{item.name}</p>
                    <p className="text-xs text-stone-400">{formatCurrency(item.price)} × {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-stone-900 shrink-0">{formatCurrency(item.total)}</p>
                </div>
              ))}
              {(!order.items || order.items.length === 0) && (
                <p className="text-sm text-stone-400 text-center py-3">Tidak ada item</p>
              )}
            </div>
          </div>

          {/* Price summary */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 sm:p-6">
            <h4 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-3">Rincian Biaya</h4>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-500">Subtotal</span>
                <span className="text-stone-800">{formatCurrency(order.subtotal)}</span>
              </div>
              {Number(order.discount_amount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-stone-500">Diskon</span>
                  <span className="text-emerald-600">-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-stone-500">Ongkos Kirim</span>
                <span className="text-stone-800">{formatCurrency(order.delivery_cost)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-stone-100">
                <span className="font-medium text-stone-800">Total</span>
                <span className="font-bold text-stone-900">{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Alasan pembatalan */}
          {order.status === "cancelled" && (order.cancel_reason || order.cancel_note) && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5 sm:p-6">
              <h4 className="text-xs font-medium text-red-400 uppercase tracking-wider mb-3">Alasan Pembatalan</h4>
              <p className="text-sm font-semibold text-red-700">{order.cancel_reason}</p>
              {order.cancel_note && (
                <p className="text-sm text-red-600 mt-2 leading-relaxed">{order.cancel_note}</p>
              )}
            </div>
          )}
        </div>
      </div>

      <ShopOrderCancelModal
        order={cancelOpen ? order : null}
        onClose={() => setCancelOpen(false)}
        onConfirm={confirmCancel}
        busy={cancelling}
      />
    </div>
  );
}
