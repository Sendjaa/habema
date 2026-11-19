import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 3;

export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export function getExpiryDate(): Date {
  const date = new Date();
  date.setMinutes(date.getMinutes() + OTP_EXPIRY_MINUTES);
  return date;
}

function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

export async function storeOTP(email: string, otp: string, type: 'register' | 'login'): Promise<void> {
  const otpHash = hashOtp(otp);
  const base = {
    email: email.toLowerCase(),
    otp,
    type,
    expires_at: getExpiryDate().toISOString(),
    verified: false,
    attempts: 0,
  };

  let { error } = await supabaseAdmin
    .from('otp_codes')
    .insert({ ...base, otp_hash: otpHash });

  // Database yang belum menjalankan migrasi otp_hash tidak boleh membuat
  // seluruh login gagal. Simpan OTP plaintext seperti skema lama; verifyOTP
  // sudah punya fallback pembandingan plaintext untuk baris tanpa hash.
  if (error && (error.code === 'PGRST204' || error.message.includes('otp_hash'))) {
    console.warn(
      '[otp] kolom otp_hash tidak ada di database, OTP disimpan tanpa hash:',
      error.message,
    );
    ({ error } = await supabaseAdmin.from('otp_codes').insert(base));
  }

  if (error) {
    throw new Error(
      `Failed to store OTP: ${error.code ? error.code + ' ' : ''}${error.message}`,
    );
  }
}

export async function verifyOTP(
  email: string,
  otp: string,
  type: 'register' | 'login'
): Promise<{ valid: boolean; message: string }> {
  const { data: records, error } = await supabaseAdmin
    .from('otp_codes')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('type', type)
    .eq('verified', false)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) return { valid: false, message: 'Gagal memverifikasi OTP' };
  if (!records || records.length === 0) return { valid: false, message: 'Kode OTP tidak ditemukan. Minta kode baru.' };

  const record = records[0];

  // Cek rate limit
  if ((record.attempts ?? 0) >= MAX_ATTEMPTS) {
    await supabaseAdmin
      .from('otp_codes')
      .update({ verified: true })
      .eq('id', record.id);
    return { valid: false, message: 'Terlalu banyak percobaan. Minta kode baru.' };
  }

  // Cek kadaluarsa
  if (new Date(record.expires_at) < new Date()) {
    return { valid: false, message: 'Kode OTP sudah kedaluwarsa. Minta kode baru.' };
  }

  // Verifikasi: bandingkan input OTP dengan otp_hash di DB.
  // Jika row tidak punya otp_hash (data lama tanpa migrasi), fallback
  // ke comparison plaintext otp untuk kompatibilitas mundur.
  const inputHash = hashOtp(otp);
  const hasHash = typeof record.otp_hash === 'string' && record.otp_hash.length > 0;

  if (hasHash && record.otp_hash !== inputHash) {
    // Hash tidak cocok — catat percobaan gagal
    await supabaseAdmin
      .from('otp_codes')
      .update({ attempts: (record.attempts || 0) + 1 })
      .eq('id', record.id);
    return { valid: false, message: 'Kode OTP salah.' };
  }

  // Fallback plaintext (data lama tanpa hash) — bandingkan langsung.
  if (!hasHash && record.otp !== otp) {
    await supabaseAdmin
      .from('otp_codes')
      .update({ attempts: (record.attempts || 0) + 1 })
      .eq('id', record.id);
    return { valid: false, message: 'Kode OTP salah.' };
  }

  // Jika berhasil (baik hash maupun plaintext), tandai verified.
  await supabaseAdmin
    .from('otp_codes')
    .update({ verified: true })
    .eq('id', record.id);

  return { valid: true, message: 'OTP berhasil diverifikasi' };
}

export async function invalidatePreviousOTPs(email: string, type: 'register' | 'login'): Promise<void> {
  const { error } = await supabaseAdmin
    .from('otp_codes')
    .update({ verified: true })
    .eq('email', email.toLowerCase())
    .eq('type', type)
    .eq('verified', false);

  if (error) {
    console.error('[otp] gagal membatalkan OTP lama:', error.code ?? '', error.message);
  }
}