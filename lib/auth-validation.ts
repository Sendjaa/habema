/**
 * Validasi input login admin — aturan ketat yang dibagi client dan server.
 *
 * Aturan sengaja dibuat ketat di sisi server juga (bukan hanya client) karena
 * validasi client bisa dilewati lewat request langsung ke API.
 */

// Email: bagian lokal + domain, tanpa spasi. Cukup ketat untuk menolak input
// yang jelas bukan email tanpa menolak alamat yang sah tapi tidak umum.
const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export const MAX_EMAIL_LENGTH = 254;
export const MAX_PASSWORD_LENGTH = 128;

export function isValidEmail(email: string): boolean {
  if (!email || email.length > MAX_EMAIL_LENGTH) return false;
  return EMAIL_RE.test(email);
}

/**
 * Password boleh kosong: akun admin yang dibuat via Supabase Invite tidak punya
 * password dan login lewat OTP. Yang diperiksa hanya panjang saat diisi.
 */
export function isPasswordTooShort(password: string): boolean {
  return password.length > 0 && password.length < 6;
}

export function isPasswordTooLong(password: string): boolean {
  return password.length > MAX_PASSWORD_LENGTH;
}

/**
 * OTP: tepat 6 digit numerik. Melindungi rute dari input yang bukan OTP sama
 * sekali (mis. string panjang) sebelum menyentuh database.
 */
export const OTP_RE = /^\d{6}$/;

export function isValidOtp(otp: string): boolean {
  return typeof otp === 'string' && OTP_RE.test(otp);
}

/**
 * Pesan error yang sengaja dibuat seragam. Kegagalan login harus terlihat
 * sama dari luar — "email tidak terdaftar", "password salah", dan "bukan admin"
 * semua kembali sebagai satu pesan yang sama, supaya penyerang tidak bisa
 * membedakan akun yang ada dari yang tidak.
 *
 * Konsekuensi: di dev lokal, kode OTP juga tetap ditampilkan, jadi tim masih
 * bisa menguji. Lihat app/api/auth/admin-login.
 */
export const GENERIC_LOGIN_ERROR = 'Kredensial tidak valid';