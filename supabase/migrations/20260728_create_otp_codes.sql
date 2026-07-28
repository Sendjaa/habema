-- Create otp_codes table for Turnstile + OTP 2FA flow
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  otp TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('register', 'login')),
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_email_type ON otp_codes(email, type);

-- RLS dimatikan karena tabel hanya diakses server-side via service_role key
ALTER TABLE otp_codes DISABLE ROW LEVEL SECURITY;