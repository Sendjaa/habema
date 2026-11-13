-- =====================================================================
-- Habema — Kegiatan (activities): katalog lengkap kelola dari admin
-- IDEMPOTEN: aman dijalankan ulang.
--
-- Sebelumnya katalog kegiatan (slug, label, blurb, urutan) hidup hanya di
-- lib/activities.ts (kode), sementara foto tile hidup di activity_tiles
-- (DB). Sekarang gabung jadi satu tabel activities di DB supaya admin bisa
-- CRUD lengkap: tambah, edit, hapus, ganti foto, atur aktif/tidak, dan urut.
--
-- data lama dari lib/activities.ts disempan sebagai baris awal dengan
-- ON CONFLICT DO NOTHING supaya foto hasil kurasi tidak tertimpa.
-- =====================================================================

create table if not exists public.activities (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  label        text not null,
  blurb        text,
  image_url    text,
  image_alt    text,
  is_active    boolean not null default true,
  display_order integer not null default 0,
  sections     text[] not null default array[]::text[],
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.activities is
  'Katalog kegiatan untuk halaman homepage dan filter katalog. Dikelola lewat /admin/activities.';

create index if not exists activities_slug_key on public.activities (slug);
create index if not exists activities_active_order on public.activities (is_active, display_order);

-- RLS aktif tanpa policy baca untuk anon: homepage baca lewat /api/home
-- (drizzle, koneksi server langsung), tulis lewat /api/admin/activities.
alter table public.activities enable row level security;

-- Seed katalog awal dari lib/activities.ts. ON CONFLICT DO NOTHING supaya
-- baris yang sudah ada (mis. sudah punya foto dari activity_tiles lama)
-- tidak tertimpa saat migrasi dijalankan ulang.
insert into public.activities (slug, label, blurb, is_active, display_order, sections)
values
  ('camping-keluarga', 'Camping Keluarga', 'Tenda besar, kompor, perlengkapan anak', true, 1, array['gear','products']),
  ('pendakian', 'Pendakian', 'Carrier, jaket windbreaker, sleeping bag', true, 2, array['gear','products']),
  ('private-camp', 'Private Camp', 'Setup ringkas untuk rombongan kecil', true, 3, array['gear','products']),
  ('campervan', 'Campervan', 'Alat ringan untuk perjalanan darat', true, 4, array['gear','products']),
  ('trail-running', 'Trail Running', 'Hydropack, vest, headlamp', true, 5, array['gear','products']),
  ('open-trip', 'Open Trip', 'Peralatan standar mengikuti setiap keberangkatan', true, 6, array['packages','gear'])
on conflict (slug) do nothing;
