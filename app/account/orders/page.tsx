"use client";
import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Package, Plus, ArrowLeft, Star, Truck, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useAccountData } from "@/lib/account-data";
import { ShopOrderCard } from "@/components/account/shop-order-card";
import { EmptyState } from "@/components/account/empty-state";
import { ShopOrderCancelModal } from "@/components/account/modals";
import { DBShopOrder } from "@/components/account/status-config";

type FilterKey = "all" | "unpaid" | "processed" | "shipped" | "to-rate" | "done" | "cancelled";

const FILTERS: { key: FilterKey; label: string; icon: any }[] = [
  { key: "all",       label: "Semua",      icon: Package },
  { key: "unpaid",    label: "Belum Bayar", icon: CreditCard },
  { key: "processed", label: "Diproses",   icon: Package },
  { key: "shipped",   label: "Dikirim",    icon: Truck },
  { key: "to-rate",   label: "Beri Penilaian", icon: Star },
  { key: "done",      label: "Selesai",    icon: Package },
  { key: "cancelled", label: "Dibatalkan", icon: Package },
];

export default function OrdersHistoryPage() {
  const router = useRouter();
  const { shopOrders, reviewedEquipmentIds, loading, refetch } = useAccountData();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [cancelOrder, setCancelOrder] = useState<DBShopOrder | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const matchesFilter = useCallback((o: DBShopOrder): boolean => {
    switch (filter) {
      case "all": return true;
      case "unpaid": return o.payment_status === "pending";
      case "processed": return o.status === "confirmed" && o.payment_status !== "cancelled";
      case "shipped": return o.status === "shipped" && o.payment_status !== "cancelled";
      case "to-rate": {
        if (o.status !== "delivered") return false;
        const items = o.items || [];
        if (items.length === 0) return true;
        const reviewed = items.filter((i: any) => reviewedEquipmentIds.includes(i.product_id)).length;
        return reviewed < items.length;
      }
      case "done": return o.status === "delivered";
      case "cancelled": return o.status === "cancelled";
      default: return true;
    }
  }, [filter, reviewedEquipmentIds]);

  const filteredOrders = shopOrders.filter(matchesFilter);

  const confirmCancel = useCallback(async (reason: string, note?: string) => {
    if (!cancelOrder) return;
    setCancelling(true);
    try {
      const res = await fetch("/api/shop-orders/cancel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: cancelOrder.id, cancel_reason: reason, cancel_note: note }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(result?.error || "Gagal membatalkan order"); return; }
      setCancelOrder(null);
      toast.success(result?.message || "Order berhasil dibatalkan");
      refetch();
    } catch {
      toast.error("Terjadi kesalahan.");
    } finally {
      setCancelling(false);
    }
  }, [cancelOrder, refetch]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      {/* Header */}
      <div className="bg-white h-full border-b border-stone-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <button
            onClick={() => router.push("/account")}
            className="flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-700 mb-3"
          >
            <ArrowLeft className="w-4.5 h-4.5" /><h1 className="text-xl sm:text-2xl font-bold text-stone-900">Pesanan Saya</h1>
          </button>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* <div>
              <p className="text-sm text-stone-500 mt-0.5">Riwayat pembelian dari toko</p>
            </div> */}
            {/* <Link href="/catalog_shop">
              <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors">
                <Plus className="w-4 h-4" /> Belanja Sekarang
              </button>
            </Link> */}
        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto overflow-y-hidden pb-0 mt-5   [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-full border whitespace-nowrap transition-colors flex-shrink-0 ${
                filter === f.key
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"
              }`}
            >
              <f.icon className="w-3.5 h-3.5" />
              {f.label}
            </button>
          ))}
        </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">

        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm">
            <EmptyState
              icon={Package}
              title="Tidak ada pesanan"
              desc="Order dari toko yang telah Anda checkout akan tampil di sini"
              action={
                <Link href="/catalog_shop">
                  <button className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors">
                    <Plus className="w-4 h-4" /> Belanja Sekarang
                  </button>
                </Link>
              }
            />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
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

      <ShopOrderCancelModal
        order={cancelOrder}
        onClose={() => setCancelOrder(null)}
        onConfirm={confirmCancel}
        busy={cancelling}
      />
    </div>
  );
}
