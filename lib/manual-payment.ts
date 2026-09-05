// =====================================================================
// Konfigurasi pembayaran manual (QRIS statis Habema).
//
// Latar: Midtrans belum siap, sehingga opsi pembayaran Midtrans
// (Transfer Bank & QRIS otomatis) disembunyikan sementara dan diganti
// QRIS statis + upload bukti bayar yang diverifikasi admin.
//
// Untuk kembali ke Midtrans: set MANUAL_QRIS_ONLY = false.
// =====================================================================

/** Selama true, hanya QRIS Manual + WhatsApp yang ditawarkan di checkout. */
export const MANUAL_QRIS_ONLY = true;

/** Nama metode pembayaran QRIS manual (disimpan di bookings.payment_method). */
export const MANUAL_QRIS_METHOD = "QRIS Manual";

/** Path gambar QRIS statis di folder public. File menyusul dari pemilik. */
export const QRIS_IMAGE_PATH = "/images/qris-habema.png";

/** Nama merchant persis seperti tercetak pada QRIS. */
export const QRIS_MERCHANT_NAME = "HABEMA OUTDOOR";

/** SLA verifikasi yang ditampilkan ke pelanggan. */
export const QRIS_VERIFY_SLA = "maks. 1×24 jam pada jam operasional";

/** Batas ukuran file bukti bayar. */
export const PROOF_MAX_SIZE = 5 * 1024 * 1024; // 5MB

export interface PaymentOption {
  id: string;
  name: string;
  desc: string;
  icon: string;
  requiresAuth: boolean;
}

/** Opsi pembayaran era Midtrans (tetap dipertahankan untuk nanti). */
export const MIDTRANS_OPTIONS: PaymentOption[] = [
  {
    id: "tf",
    name: "Transfer Bank",
    desc: "Verifikasi manual 10-30 menit",
    icon: "🏦",
    requiresAuth: true,
  },
  {
    id: "qris",
    name: "QRIS",
    desc: "Otomatis & Instan (Gopay, OVO, Dana)",
    icon: "📸",
    requiresAuth: true,
  },
  {
    id: "wa",
    name: "WhatsApp Konfirmasi",
    desc: "Tanya admin via WhatsApp",
    icon: "💬",
    requiresAuth: false,
  },
];

/** Opsi pembayaran era manual: QRIS statis Habema + WhatsApp. */
export const MANUAL_OPTIONS: PaymentOption[] = [
  {
    id: "qris-manual",
    name: MANUAL_QRIS_METHOD,
    desc: `Scan QRIS ${QRIS_MERCHANT_NAME}, upload bukti bayar`,
    icon: "📸",
    requiresAuth: true,
  },
  {
    id: "wa",
    name: "WhatsApp Konfirmasi",
    desc: "Tanya admin via WhatsApp",
    icon: "💬",
    requiresAuth: false,
  },
];

/** Daftar opsi aktif sesuai flag. */
export function getActivePaymentOptions(): PaymentOption[] {
  return MANUAL_QRIS_ONLY ? MANUAL_OPTIONS : MIDTRANS_OPTIONS;
}

/** True bila metode memakai alur Midtrans (Snap/API). */
export function isMidtransMethod(method: string | null | undefined): boolean {
  return method === "Transfer Bank" || method === "QRIS";
}

/** True bila metode memakai alur QRIS manual + upload bukti. */
export function isManualQrisMethod(method: string | null | undefined): boolean {
  return method === MANUAL_QRIS_METHOD;
}

export function formatRupiah(n: number): string {
  return `Rp${Number(n || 0).toLocaleString("id-ID")}`;
}
