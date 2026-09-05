-- =====================================================================
-- PERBAIKAN (jalankan sekali di Supabase Dashboard > SQL Editor)
-- Error di halaman /account:
--   [account] Gagal memuat bookings: "permission denied for table users" (42501)
--
-- Penyebab: role `authenticated` (login user) tidak memiliki privilege
-- pada tabel public.users, padahal policy RLS tabel bookings merujuk ke
-- tabel users saat dievaluasi. Hasil: SELECT bookings dari client gagal
-- 42501 dan riwayat rental tampil 0.
--
-- Mirip dengan perbaikan service_role di repair-42501-users.sql, tapi
-- kali ini untuk role authenticated/anon. Aman dijalankan berulang.
-- =====================================================================

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

grant usage on schema public to anon;
grant select on all tables in schema public to anon;
grant usage, select on all sequences in schema public to anon;

-- Agar tabel baru yang dibuat ke depan juga otomatis ter-grant
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage, select on sequences to authenticated;
alter default privileges in schema public
  grant select on tables to anon;
alter default privileges in schema public
  grant usage, select on sequences to anon;
