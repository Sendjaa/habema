-- Metode pembayaran yang dipilih saat booking (Midtrans, Transfer Bank,
-- QRIS manual, WhatsApp Konfirmasi, dst). Dipakai app/booking/page.tsx,
-- halaman admin, dan webhook Midtrans untuk menyimpan payment_type.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_method text;
