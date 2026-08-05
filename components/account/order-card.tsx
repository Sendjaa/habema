"use client";
import { Calendar, Clock, X, ChevronRight } from "lucide-react";
import { STATUS_CONFIG, DBOrder, formatDateShort } from "./status-config";

// ── Order Card Component (Rental) ──
export function OrderCard({
  order,
  onDetail,
  onCancel,
  showCancel = false,
  dimmed = false,
}: {
  order: DBOrder;
  onDetail: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
  dimmed?: boolean;
}) {
  const cfg = STATUS_CONFIG[order.status] ?? {
    label: order.status,
    color: "text-stone-700",
    bg: "bg-stone-100 border-stone-200",
    dot: "bg-stone-400",
  };

  return (
    <div
      className={`bg-white rounded-xl border border-stone-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${
        dimmed ? "opacity-60" : ""
      }`}
    >
      {/* Top accent bar */}
      <div className={`h-0.5 w-full ${cfg.dot}`} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
            <span className="text-xs text-stone-400">{formatDateShort(order.created_at)}</span>
          </div>
          <span className="text-xs font-mono text-stone-400 flex-shrink-0">
            #{order.id.slice(0, 8).toUpperCase()}
          </span>
        </div>

        {/* Items */}
        <div className="mb-4">
          <p className="text-sm font-semibold text-stone-800 leading-snug line-clamp-2">
            {order.items.join(", ")}
          </p>
        </div>

        {/* Rental period */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500 mb-4 p-3 bg-stone-50 rounded-lg">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            <span>{order.start_date}</span>
          </div>
          <div className="text-stone-300">→</div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            <span>{order.end_date}</span>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            <span className="font-medium text-stone-600">{order.rental_days} hari</span>
          </div>
        </div>

        {/* Footer: price + actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-stone-400 mb-0.5">Total</p>
            <p className="text-base font-bold text-stone-900">
              Rp {order.total.toLocaleString("id-ID")}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {showCancel && onCancel && (
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
