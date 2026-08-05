"use client";
import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Package, Plus, ArrowLeft, Tent, Clock, Award, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAccountData } from "@/lib/account-data";
import { OrderCard } from "@/components/account/order-card";
import { EmptyState } from "@/components/account/empty-state";
import { BookingCancelModal } from "@/components/account/modals";
import { DBOrder } from "@/components/account/status-config";

type FilterKey = "active" | "history" | "cancelled";

const FILTERS: { key: FilterKey; label: string; icon: any }[] = [
  { key: "active",    label: "Aktif",      icon: Tent },
  { key: "history",   label: "Riwayat",    icon: Award },
  { key: "cancelled", label: "Dibatalkan", icon: AlertCircle },
];

export default function RentalsHistoryPage() {
  const router = useRouter();
  const { bookings, loading, refetch } = useAccountData();
  const [filter, setFilter] = useState<FilterKey>("active");
  const [cancelOrder, setCancelOrder] = useState<DBOrder | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const activeOrders = bookings.filter((o) => !["returned", "completed", "cancelled"].includes(o.status));
  const historyOrders = bookings.filter((o) => ["returned", "completed"].includes(o.status));
  const cancelledOrders = bookings.filter((o) => o.status === "cancelled");

  const filteredOrders = filter === "active"
    ? activeOrders
    : filter === "history"
      ? historyOrders
      : cancelledOrders;

  const handleDetail = useCallback((id: string) => router.push(`/bookings/${id}`), [router]);

  const confirmCancel = useCallback(async (reason: string, note?: string) => {
    if (!cancelOrder) return;
    setCancelling(true);
    try {
      const res = await fetch("/api/bookings/cancel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: cancelOrder.id, cancel_reason: reason, cancel_note: note }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(result?.error || "Gagal membatalkan pesanan."); return; }
      setCancelOrder(null);
      toast.success(result?.message || "Pesanan berhasil dibatalkan");
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
      <div className="bg-white border-b border-stone-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <button
            onClick={() => router.push("/account")}
            className="flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-700 mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Akun
          </button>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-stone-900">Rental Peralatan</h1>
              <p className="text-sm text-stone-500 mt-0.5">Riwayat penyewaan peralatan</p>
            </div>
            <Link href="/catalog">
              <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors">
                <Plus className="w-4 h-4" /> Sewa Sekarang
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto overflow-y-hidden pb-2 mb-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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

        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm">
            <EmptyState
              icon={filter === "history" ? Clock : Package}
              title={filter === "active" ? "Tidak ada rental aktif" : "Tidak ada data"}
              desc={filter === "active" ? "Anda belum memiliki penyewaan yang sedang berlangsung" : "Belum ada data pada kategori ini"}
              action={
                filter === "active" ? (
                  <Link href="/catalog">
                    <button className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors">
                      <Plus className="w-4 h-4" /> Sewa Sekarang
                    </button>
                  </Link>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onDetail={() => handleDetail(order.id)}
                onCancel={() => setCancelOrder(order)}
                showCancel={filter === "active"}
                dimmed={filter === "cancelled"}
              />
            ))}
          </div>
        )}
      </div>

      <BookingCancelModal
        order={cancelOrder}
        open={!!cancelOrder}
        onClose={() => setCancelOrder(null)}
        onConfirm={confirmCancel}
        busy={cancelling}
      />
    </div>
  );
}
