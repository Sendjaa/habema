-- =====================================================================
-- PERBAIKAN DARURAT (jalankan sekali di Supabase Dashboard > SQL Editor)
-- Error: "permission denied for table users" (42501) saat simpan
-- identitas & buat booking. Penyebab: GRANT service_role + policy RLS
-- tabel users belum ada di database live (migrasi lokal belum di-push).
--
-- Aman dijalankan berulang (idempotent). Setelah ini, migrasi lokal
-- tetap menjadi sumber kebenaran untuk `supabase db push` berikutnya.
-- =====================================================================

-- 1. GRANT service_role untuk seluruh tabel public (butuh BYPASSRLS saja
--    tidak cukup; privilege tabel tetap diperlukan)
grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public
  grant usage, select on sequences to service_role;

-- 2. Policy RLS tabel users (baca publik, tulis milik sendiri)
drop policy if exists "public read users" on public.users;
create policy "public read users" on public.users
  for select to anon, authenticated using (true);

drop policy if exists "insert own user" on public.users;
create policy "insert own user" on public.users
  for insert to authenticated with check (auth.uid() = id);

drop policy if exists "update own user" on public.users;
create policy "update own user" on public.users
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- 3. Kolom bukti pembayaran QRIS manual (sama isi dengan migrasi
--    20260904000000_manual_qris_payment_proof.sql)
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_proof_uploaded_at TIMESTAMPTZ;

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', true)
on conflict (id) do nothing;

drop policy if exists "payment-proofs upload own" on storage.objects;
create policy "payment-proofs upload own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "payment-proofs update own" on storage.objects;
create policy "payment-proofs update own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "payment-proofs read" on storage.objects;
create policy "payment-proofs read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'payment-proofs');
