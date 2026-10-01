-- ============================================================
-- Shim kompatibilitas untuk restore dump production ke
-- PostgreSQL lokal (tanpa Supabase).
--
-- Jalankan file ini SEBELUM file dump schema production.
--     psql -h localhost -U postgres -d habema_local -f scripts/local-db-shim.sql
--
-- ------------------------------------------------------------
-- KENAPA FILE INI ADA
-- ------------------------------------------------------------
-- Dump schema `public` dari Supabase membawa satu objek yang menunjuk
-- ke schema `auth` milik Supabase:
--
--     create trigger on_auth_user_created
--       after insert on auth.users
--       for each row execute function public.handle_new_user();
--
-- Tabel `auth.users` tidak ada di PostgreSQL biasa, jadi restore akan
-- berhenti di baris itu ("relation auth.users does not exist") dan
-- sisa dump tidak ikut terpasang.
--
-- Shim ini membuat tabel kosong tersebut supaya restore selesai.
--
-- ------------------------------------------------------------
-- YANG PERLU ANDA TAHU
-- ------------------------------------------------------------
-- 1. Tabel auth.users di sini KOSONG dan tidak akan pernah terisi.
--    Login pengguna ditangani auth sendiri; kode auth nanti menulis
--    LANGSUNG ke public.users, bukan lewat tabel ini.
--
-- 2. Karena auth.users kosong, trigger on_auth_user_created tidak
--    pernah menyala — ia hanya ikut terpasang agar bentuk schema
--    lokal sama dengan production. Tidak ada efek samping.
--
-- 3. Kolom di bawah bukan tebakan: itu persis kolom yang dibaca
--    public.handle_new_user() di
--    supabase/migrations/20260710000200_fix_rls_and_storage.sql:103-108
--    (new.id, new.email, new.raw_user_meta_data, new.last_sign_in_at).
--
-- 4. RLS tidak dipulihkan di sini. Dump dijalankan dengan
--    --no-policies, dan koneksi `pg` sebagai superuser memang
--    melewati RLS sepenuhnya. Otorisasi harus ditegakkan di kode
--    (lihat catatan RLS di rencana migrasi).
-- ============================================================

create schema if not exists auth;

create table if not exists auth.users (
  id                 uuid primary key default gen_random_uuid(),
  email              text,
  raw_user_meta_data jsonb default '{}'::jsonb,
  last_sign_in_at    timestamptz,
  created_at         timestamptz not null default now()
);

comment on table auth.users is
  'Stub kosong, hanya agar trigger on_auth_user_created dari dump production '
  'bisa terpasang di PostgreSQL lokal. Tidak dipakai aplikasi.';
