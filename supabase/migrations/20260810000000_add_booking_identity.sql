-- Snapshot identitas penyewa pada booking (termasuk tamu/anonymous).
-- Nilai diambil dari form Verifikasi Identitas saat pemesanan.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS customer_full_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_id_type TEXT,
  ADD COLUMN IF NOT EXISTS customer_id_number TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT;
