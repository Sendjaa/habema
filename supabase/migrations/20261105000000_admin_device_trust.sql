-- =====================================================================
-- Habema — Perangkat terpercaya untuk login admin (admin_device_trust)
-- IDEMPOTEN: aman dijalankan ulang.
--
-- Login admin dijaga password + OTP lewat email. OTP itu satu-satunya
-- 2FA yang punya akun admin, jadi tidak boleh dihapus — yang bikin
-- tidak nyaman adalah diminta ulang di perangkat yang sama setiap kali.
-- Tabel ini menyimpan penanda "perangkat ini sudah pernah menyelesaikan
-- OTP" selama 30 hari, sehingga OTP hanya diminta untuk perangkat baru.
--
-- Yang disimpan BUKAN token aslinya: cookie berisi token acak, kolom ini
-- hanya menampung sha256-nya. Kebocoran isi tabel tidak bisa dipakai
-- untuk login, dan satu baris bisa dicabut tanpa menyentuh yang lain.
--
-- RLS diaktifkan tanpa policy: anon key dan JWT pengguna tidak boleh
-- membaca tabel ini sama sekali. Yang mengaksesnya hanya koneksi server
-- langsung (drizzle, lewat POSTGRES_URL) — sama seperti client_organizations.
-- =====================================================================

create table if not exists public.admin_device_trust (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null,
  email        text not null,
  token_hash   text not null unique,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz,
  expires_at   timestamptz not null
);

comment on column public.admin_device_trust.token_hash is
  'sha256 hex dari token di cookie habema_admin_trust; token aslinya tidak disimpan';

comment on column public.admin_device_trust.user_id is
  'auth.users.id — pencocokan harus email DAN user, supaya baris lama tidak ikut sah';

create index if not exists admin_device_trust_user_idx
  on public.admin_device_trust (user_id, email);

create index if not exists admin_device_trust_expires_idx
  on public.admin_device_trust (expires_at);

alter table public.admin_device_trust enable row level security;
