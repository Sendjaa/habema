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

export async function storeOTP(email: string, otp: string, type: 'register' | 'login'): Promise<void> {
  const { error } = await supabaseAdmin
    .from('otp_codes')
    .insert({
      email: email.toLowerCase(),
      otp,
      type,
      expires_at: getExpiryDate().toISOString(),
      verified: false,
      attempts: 0,
    });

  if (error) throw new Error(`Failed to store OTP: ${error.message}`);
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

  if (record.attempts >= MAX_ATTEMPTS) {
    await supabaseAdmin
      .from('otp_codes')
      .update({ verified: true })
      .eq('id', record.id);
    return { valid: false, message: 'Terlalu banyak percobaan. Minta kode baru.' };
  }

  if (new Date(record.expires_at) < new Date()) {
    return { valid: false, message: 'Kode OTP sudah kedaluwarsa. Minta kode baru.' };
  }

  if (record.otp !== otp) {
    await supabaseAdmin
      .from('otp_codes')
      .update({ attempts: (record.attempts || 0) + 1 })
      .eq('id', record.id);
    return { valid: false, message: 'Kode OTP salah.' };
  }

  await supabaseAdmin
    .from('otp_codes')
    .update({ verified: true })
    .eq('id', record.id);

  return { valid: true, message: 'OTP berhasil diverifikasi' };
}

export async function invalidatePreviousOTPs(email: string, type: 'register' | 'login'): Promise<void> {
  await supabaseAdmin
    .from('otp_codes')
    .update({ verified: true })
    .eq('email', email.toLowerCase())
    .eq('type', type)
    .eq('verified', false);
}