/**
 * Deteksi "dev yang memakai shim auth lokal".
 *
 * Login admin dan login pengguna dijaga Turnstile + OTP lewat email. Dua-duanya
 * mati di dev lokal: Cloudflare tidak mau menyelesaikan challenge di localhost,
 * dan Resend tidak boleh dipakai mengirim email dari mesin dev. Keduanya baru
 * tercapai lagi kalau dev menunjuk ke Supabase production — yang sengaja
 * diblokir next.config.mjs.
 *
 * Yang dibaca flag ini hanyalah "lingkungan tidak bisa menjangkau layanan
 * eksternal", BUKAN "login boleh dilewati". Jalurnya tetap satu: rute auth
 * tetap memeriksa password, tetap memutuskan perangkat terpercaya vs OTP, dan
 * halaman login tetap memanggil rute itu. Bedanya cuma dua — Turnstile tidak
 * diverifikasi, dan kode OTP ditulis ke terminal alih-alih dikirim email.
 * Karena itu flag ini dipakai di sisi server (lib/otp-email.ts,
 * app/api/auth/admin-login, app/api/auth/login) dan di sisi client untuk
 * menyembunyikan widget yang toh tidak akan pernah selesai.
 *
 * Dua syarat, bukan satu:
 *   - NODE_ENV development. Build produksi selalu "production", jadi flag ini
 *     ikut hilang dari bundle, bukan cuma mati saat runtime.
 *   - Host URL auth adalah 127.0.0.1/localhost. Produksi (supabase.co) dan
 *     deployment lain tidak pernah cocok.
 */

const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '::1'])

function isLocalAuthUrl(value: string | undefined): boolean {
  if (!value) return false
  try {
    return LOCAL_HOSTS.has(new URL(value).hostname)
  } catch {
    return false
  }
}

export const DEV_LOCAL_AUTH =
  process.env.NODE_ENV === 'development' &&
  isLocalAuthUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
