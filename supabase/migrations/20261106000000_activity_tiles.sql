-- =====================================================================
-- Habema — activity_tiles: foto tile kegiatan di homepage
-- IDEMPOTEN: aman dijalankan ulang.
--
-- Sebelumnya foto tile diambil dari equipment.imageUrl (alat paling sering
-- disewa untuk kegiatan itu). Itu membuat tampilan homepage ikut berubah
-- setiap kali katalog berubah, dan foto terbaik belum tentu ada di alat
-- termahal/terpopuler. Sekarang fotunya kurasi: satu baris per slug,
-- dikelola dari /admin/activities.
--
-- Daftar kegiatannya sendiri TETAP hidup di kode (lib/activities.ts) —
-- label, blurb, urutan, dan filter /catalog_rental?kegiatan=<slug>. Tabel
-- ini hanya menyimpan gambarnya. Slug divalidasi di /api/admin/activities
-- terhadap lib/activities.ts, bukan lewat CHECK: kalau batasnya ada di SQL,
-- menambah kegiatan berarti menyunting dua tempat, dan migrasi bisa kalah
-- versi dari kode.
-- =====================================================================

create table if not exists public.activity_tiles (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  image_url  text not null,
  image_alt  text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.activity_tiles.slug is
  'slug dari lib/activities.ts; satu baris per kegiatan';
comment on column public.activity_tiles.image_alt is
  'teks alternatif foto tile; kosong = memakai label kegiatan';
comment on column public.activity_tiles.is_active is
  'false = jangan pakai foto ini; tile jatuh ke fallbackActivityImage';

-- RLS aktif tanpa policy, sama seperti admin_device_trust: tidak ada pihak
-- yang membaca tabel ini lewat anon key — homepage membacanya lewat /api/home
-- (drizzle, koneksi server langsung), dan tulisnya lewat /api/admin/activities
-- (juga drizzle). Policy baca untuk role anon/authenticated juga tidak bisa
-- dibuat di sini: database dev lokal tidak punya role itu, jadi migrasi ini
-- harus jalan di dua tempat.
alter table public.activity_tiles enable row level security;

-- ---------------------------------------------------------------------
-- 2. Bucket Storage untuk file foto tile
-- ---------------------------------------------------------------------
-- Foto diunggah sebagai file dari /admin/activities, tidak lewat URL.
-- Upload-nya server-side (service role, lihat app/api/admin/activities),
-- jadi yang dibutuhkan hanya policy baca; tidak ada jalur tulis untuk anon.
--
-- Dibungkus DO block: database dev lokal adalah PostgreSQL biasa tanpa
-- schema storage, dan migrasi yang sama harus tetap bisa dijalankan di
-- sana. Di Supabase (production/project dev) blok ini jalan seperti biasa.
do $$
begin
  if not exists (select 1 from pg_namespace where nspname = 'storage') then
    return;
  end if;

  insert into storage.buckets (id, name, public)
  values ('activities', 'activities', true)
  on conflict (id) do nothing;

  drop policy if exists "activities read" on storage.objects;
  create policy "activities read" on storage.objects
    for select to anon, authenticated
    using (bucket_id = 'activities');
end $$;

-- Seed: pertahankan tampilan hari ini dengan logika lama (alat aktif paling
-- sering disewa yang punya foto). ON CONFLICT DO NOTHING supaya foto hasil
-- kurasi admin tidak pernah tertimpa saat migrasi dijalankan ulang.
with tagged as (
  select eq.name, eq.rental_count, eq.image_url, slug
  from public.equipment eq, unnest(eq.activities) as slug
  where eq.is_active
    and eq.image_url is not null
    and eq.image_url <> ''
)
insert into public.activity_tiles (slug, image_url, is_active)
select distinct on (slug) slug, image_url, true
from tagged
order by slug, rental_count desc nulls last, name
on conflict (slug) do nothing;
