-- =====================================================================
-- Habema — Kegiatan (activities) + Instansi Penyewa (client_organizations)
-- IDEMPOTEN: aman dijalankan ulang.
--
-- 1. equipment.activities  : label kegiatan per alat (text[]), isinya slug
--    dari konstanta lib/activities.ts. Filter katalog memakai @> ARRAY[...]
--    lewat index GIN, jadi penyaringan terjadi di DB — bukan di browser.
-- 2. client_organizations  : daftar instansi/lembaga/organisasi yang pernah
--    menyewa, untuk logo cloud di homepage. Baris baru default TIDAK tampil
--    (is_active = false): nama instansi adalah klaim publik, jadi harus
--    diaktifkan manual setelah izin tertulis dicatat di consent_note.
--
-- Tidak ada seed di sini: isi kegiatan hidup di kode (lib/activities.ts)
-- supaya label, slug, dan foto tidak bisa berbeda antara DB dan UI.
-- Tabel ini dibaca lewat drizzle (sisi server), jadi tidak butuh policy RLS
-- untuk anon key; kalau nanti dibaca dari client, policy-nya perlu dibuat.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Kolom activities di equipment
-- ---------------------------------------------------------------------
alter table public.equipment
  add column if not exists activities text[] not null default array[]::text[];

comment on column public.equipment.activities is
  'Slug kegiatan dari lib/activities.ts, mis. {camping-keluarga,pendakian}';

create index if not exists equipment_activities_gin
  on public.equipment using gin (activities);

-- ---------------------------------------------------------------------
-- 2. Tabel client_organizations
-- ---------------------------------------------------------------------
create table if not exists public.client_organizations (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  logo_url           text,
  sector             text,
  documentation_slug text,
  display_order      integer not null default 0,
  is_active          boolean not null default false,
  consent_note       text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

comment on column public.client_organizations.is_active is
  'false sampai izin publikasi dari instansi tercatat di consent_note';
comment on column public.client_organizations.documentation_slug is
  'isi bila halaman dokumentasi kegiatan (/organisasi/[slug]) sudah tersedia';

create unique index if not exists client_organizations_name_key
  on public.client_organizations (lower(name));

create index if not exists client_organizations_active_order
  on public.client_organizations (is_active, display_order);
