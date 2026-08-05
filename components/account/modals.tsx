"use client";
import { useState } from "react";
import { AlertCircle } from "lucide-react";
import {
  DBOrder,
  DBShopOrder,
  formatCurrency,
} from "./status-config";

const CANCEL_REASONS = [
  { key: "change_plan",  label: "Mengubah rencana / tidak jadi" },
  { key: "found_cheaper", label: "Menemukan harga yang lebih murah" },
  { key: "wrong_item",   label: "Salah memilih produk / ukuran" },
  { key: "long_delivery", label: "Waktu pengiriman terlalu lama" },
  { key: "other",        label: "Alasan lainnya" },
] as const;

export type CancelReasonKey = (typeof CANCEL_REASONS)[number]["key"];

interface CancelFormState {
  reason: CancelReasonKey | "";
  note: string;
}

function ReasonForm({
  state,
  setState,
}: {
  state: CancelFormState;
  setState: React.Dispatch<React.SetStateAction<CancelFormState>>;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-stone-700 mb-2">Pilih alasan pembatalan</p>
        <div className="space-y-2">
          {CANCEL_REASONS.map((r) => (
            <label
              key={r.key}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                state.reason === r.key
                  ? "border-red-300 bg-red-50/50"
                  : "border-stone-200 hover:border-stone-300"
              }`}
            >
              <input
                type="radio"
                name="cancel-reason"
                value={r.key}
                checked={state.reason === r.key}
                onChange={() => setState((prev) => ({ ...prev, reason: r.key }))}
                className="mt-0.5 w-4 h-4 accent-red-600"
              />
              <span className="text-sm text-stone-700">{r.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-stone-700 mb-1.5 block">
          Detail (opsional)
        </label>
        <textarea
          value={state.note}
          onChange={(e) => setState((prev) => ({ ...prev, note: e.target.value }))}
          placeholder="Jelaskan detail alasan Anda agar kami dapat membantu (mis. jadwal berubah, ukuran tidak sesuai)..."
          rows={3}
          maxLength={500}
          className="w-full text-sm text-stone-800 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 placeholder:text-stone-400"
        />
        <p className="text-right text-[10px] text-stone-400 mt-1">{state.note.length}/500</p>
      </div>
    </div>
  );
}

// ── Booking (Rental) Cancel Modal ──
export function BookingCancelModal({
  order,
  open,
  onClose,
  onConfirm,
  busy = false,
}: {
  order: DBOrder | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string, note?: string) => void;
  busy?: boolean;
}) {
  const [state, setState] = useState<CancelFormState>({ reason: "", note: "" });
  const [error, setError] = useState("");

  const handleConfirm = () => {
    if (!state.reason) {
      setError("Pilih alasan pembatalan terlebih dahulu.");
      return;
    }
    setError("");
    onConfirm(state.reason, state.note.trim() || undefined);
  };

  const handleClose = () => {
    setError("");
    setState({ reason: "", note: "" });
    onClose();
  };

  if (!open || !order) return null;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 pt-6 pb-4 border-b border-stone-100 flex-shrink-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-base font-semibold text-stone-900">Batalkan Pesanan?</h3>
          </div>
        </div>
        <div className="px-6 py-4 overflow-y-auto flex-1">
          <div className="bg-stone-50 rounded-xl p-3 border border-stone-100 mb-4">
            <p className="text-sm font-semibold text-stone-800 line-clamp-2">
              {order.items.join(", ")}
            </p>
            <p className="text-xs text-stone-500 mt-1">
              {order.start_date} – {order.end_date}
            </p>
            <p className="text-sm font-bold text-stone-900 mt-1">
              Rp {order.total.toLocaleString("id-ID")}
            </p>
          </div>
          <ReasonForm state={state} setState={setState} />
          {error && (
            <p className="text-xs text-red-500 mt-3">{error}</p>
          )}
          <p className="text-xs text-red-500 mt-3">
            ⚠ Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>
        <div className="px-6 pb-6 flex gap-3 flex-shrink-0">
          <button
            onClick={handleClose}
            disabled={busy}
            className="flex-1 py-2.5 text-sm font-medium text-stone-700 bg-stone-100 rounded-xl hover:bg-stone-200 transition-colors disabled:opacity-50"
          >
            Tidak, Kembali
          </button>
          <button
            onClick={handleConfirm}
            disabled={busy}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {busy ? "Membatalkan..." : "Ya, Batalkan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Shop Order Cancel Modal ──
export function ShopOrderCancelModal({
  order,
  onClose,
  onConfirm,
  busy = false,
}: {
  order: DBShopOrder | null;
  onClose: () => void;
  onConfirm: (reason: string, note?: string) => void;
  busy?: boolean;
}) {
  const [state, setState] = useState<CancelFormState>({ reason: "", note: "" });
  const [error, setError] = useState("");

  const handleConfirm = () => {
    if (!state.reason) {
      setError("Pilih alasan pembatalan terlebih dahulu.");
      return;
    }
    setError("");
    onConfirm(state.reason, state.note.trim() || undefined);
  };

  const handleClose = () => {
    setError("");
    setState({ reason: "", note: "" });
    onClose();
  };

  if (!order) return null;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 pt-6 pb-4 border-b border-stone-100 flex-shrink-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-base font-semibold text-stone-900">Batalkan Pembelian?</h3>
          </div>
        </div>
        <div className="px-6 py-4 overflow-y-auto flex-1">
          <div className="bg-stone-50 rounded-xl p-3 border border-stone-100 mb-4">
            <p className="text-sm font-semibold text-stone-800 line-clamp-2">
              {order.items?.map((i) => i.name).join(", ") || "Pesanan"}
            </p>
            <p className="text-xs text-stone-500 mt-1">
              {order.order_id || ('#' + order.id.slice(0, 8).toUpperCase())}
            </p>
            <p className="text-sm font-bold text-stone-900 mt-1">
              {formatCurrency(order.total_amount)}
            </p>
          </div>
          <ReasonForm state={state} setState={setState} />
          {error && (
            <p className="text-xs text-red-500 mt-3">{error}</p>
          )}
          <p className="text-xs text-red-500 mt-3">
            ⚠ Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>
        <div className="px-6 pb-6 flex gap-3 flex-shrink-0">
          <button
            onClick={handleClose}
            disabled={busy}
            className="flex-1 py-2.5 text-sm font-medium text-stone-700 bg-stone-100 rounded-xl hover:bg-stone-200 transition-colors disabled:opacity-50"
          >
            Tidak, Kembali
          </button>
          <button
            onClick={handleConfirm}
            disabled={busy}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {busy ? "Membatalkan..." : "Ya, Batalkan"}
          </button>
        </div>
      </div>
    </div>
  );
}
