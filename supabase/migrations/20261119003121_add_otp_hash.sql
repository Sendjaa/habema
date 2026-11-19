-- Add otp_hash column to otp_codes table
--
-- OTP sekarang di-hash dengan SHA-256 sebelum disimpan.
-- Kolom otp lama tetap ada untuk backward compatibility (data yang sudah ada
-- sebelum migrasi ini). Kolom otp_hash nullable di awal, lalu di-populate
-- oleh aplikasi saat OTP baru dibuat.
--
-- RLS sudah disabled dari migration sebelumnya.

ALTER TABLE otp_codes
ADD COLUMN IF NOT EXISTS otp_hash TEXT;

-- Index untuk performa verifikasi
CREATE INDEX IF NOT EXISTS idx_otp_codes_email_type_verified
ON otp_codes(email, type, verified)
WHERE verified = false;