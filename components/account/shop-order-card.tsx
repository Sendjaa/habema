"use client";
import { Package, X, ChevronRight } from "lucide-react";
import {
  SHOP_STATUS_CONFIG,
  SHOP_PAYMENT_CONFIG,
  DBShopOrder,
  formatCurrency,
  formatDateShort,
} from "./status-config";

// ── Shop Order Card Component (Pembelian toko) ──
export function ShopOrderCard({ order, onDetail, onCancel }: { order: DBShopOrder; onDetail: () => void; onCancel?: () => void }) {
  const statusCfg = SHOP_STATUS_CONFIG[order.status] ?? {
    label: order.status,
    color: "text-stone-700",
    bg: "bg-stone-100 border-stone-200",
    dot: "bg-stone-400",
  };
  const paymentCfg = SHOP_PAYMENT_CONFIG[order.payment_status] ?? {
    label: order.payment_status,
    color: "text-stone-700",
    bg: "bg-stone-100 border-stone-200",
  };
  const isDimmed = order.status === "cancelled" || ["cancelled", "failed", "expired"].includes(order.payment_status);
  const canCancel = onCancel && !["cancelled", "delivered", "refunded", "expired"].includes(order.status)
    && !["cancelled", "refunded", "expired"].includes(order.payment_status);

  return (
    <div className={`bg-white rounded-xl border border-stone-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${isDimmed ? "opacity-60" : ""}`}>
      <div className={`h-0.5 w-full ${statusCfg.dot}`} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <span className="text-xs font-mono text-stone-400 flex-shrink-0">
            {order.order_id || ('#' + order.id.slice(0, 8).toUpperCase())}
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusCfg.bg} ${statusCfg.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
              {statusCfg.label}
            </span>
            {/* <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${paymentCfg.bg} ${paymentCfg.color}`}>
              {paymentCfg.label}
            </span> */}
            {/* <span className="text-xs text-stone-400">{formatDateShort(order.created_at)}</span> */}
          </div>
          
        </div>

        {/* Items */}
        <div className="space-y-2 mb-4">
          {order.items?.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-0rounded-lg">
              {item.product?.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.product.image_url} alt={item.name}
                  className="w-18 h-18 object-cover rounded-lg border border-stone-200 shrink-0" />
              ) : (
                <div className="w-18 h-18 bg-stone-100 rounded-lg border border-stone-200 flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4 text-stone-400" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-stone-800 leading-snug line-clamp-1">{item.name}</p>
                <p className="text-xs text-stone-400">{formatCurrency(item.price)} × {item.quantity}</p>
              </div>
              <p className="text-sm font-semibold text-stone-900 shrink-0">{formatCurrency(item.total)}</p>
            </div>
          ))}
          {(!order.items || order.items.length === 0) && (
            <p className="text-sm text-stone-400">Tidak ada item</p>
          )}
        </div>

        {/* Footer: price + actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* <div>
            <p className="text-xs text-stone-400 mb-0.5">Total</p>
            <p className="text-base font-bold text-stone-900">
              {formatCurrency(order.total_amount)}
            </p>
          </div> */}
          <div className="flex items-center gap-2 ml-auto">
            {canCancel && (
              <button
                onClick={onCancel}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Batalkan
              </button>
            )}
            <button
              onClick={onDetail}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-stone-800 rounded-lg hover:bg-stone-700 transition-colors"
            >
              Detail
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
