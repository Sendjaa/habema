-- Bukti pembayaran manual (QRIS statis Habema).
-- Alur: user upload screenshot bukti bayar via website -> admin verifikasi
-- di dashboard (payment_status pending -> paid / failed).
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_proof_uploaded_at TIMESTAMPTZ;

-- ---------------------------------------------------------------------
-- Storage bucket untuk bukti pembayaran
-- ---------------------------------------------------------------------
-- Upload dilakukan server-side via service-role (melewati RLS), sehingga
-- policy di bawah hanya sebagai pengaman bila suatu saat upload dilakukan
-- langsung dari client. Path: <user_id>/<booking_id>_<timestamp>.<ext>
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', true)
on conflict (id) do nothing;

-- Upload: hanya user login, ke folder miliknya sendiri
drop policy if exists "payment-proofs upload own" on storage.objects;
create policy "payment-proofs upload own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Update/replace file di folder sendiri
drop policy if exists "payment-proofs update own" on storage.objects;
create policy "payment-proofs update own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Baca: publik (bucket public); dibatasi ke bucket ini saja
drop policy if exists "payment-proofs read" on storage.objects;
create policy "payment-proofs read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'payment-proofs');
