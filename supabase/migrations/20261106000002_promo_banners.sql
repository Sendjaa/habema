-- =====================================================================
-- Habema — promo_banners: banner promo homepage
-- IDEMPOTEN: aman dijalankan ulang.
--
-- Section "Promo" di homepage menampilkan banner (gambar kampanye), BUKAN
-- kartu produk. Dulu isinya diturunkan dari equipment.is_promo, jadi yang
-- tampil selalu foto alat plus nama dan harganya — sebuah daftar produk
-- kedua di halaman yang sama, bukan banner.
--
-- Sekarang banner punya tabelnya sendiri dan dikelola dari
-- /admin/promo-banners. Promo per produk (equipment.is_promo) tetap ada:
-- harganya dipakai halaman /bundles dan detail produk, bukan untuk mengisi
-- section ini.
--
-- Tautan banner opsional (link_url). Banner tanpa tautan tetap tayang sebagai
-- gambar; ini bukan tombol, jadi tidak wajib mengarah ke mana pun.
-- =====================================================================

create table if not exists public.promo_banners (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  image_url     text not null,
  link_url      text,
  starts_at     timestamptz,
  ends_at       timestamptz,
  is_active     boolean not null default true,
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on column public.promo_banners.title is
  'judul banner; juga dipakai sebagai teks alternatif gambarnya';
comment on column public.promo_banners.link_url is
  'tujuan klik (path internal atau http/https); kosong = banner tidak bisa diklik';
comment on column public.promo_banners.starts_at is
  'null = langsung tayang';
comment on column public.promo_banners.ends_at is
  'null = tayang tanpa batas waktu';
comment on column public.promo_banners.is_active is
  'false = jangan tayang di homepage';

create index if not exists promo_banners_tayang_idx
  on public.promo_banners (display_order, created_at desc)
  where is_active;

-- RLS aktif tanpa policy, sama seperti activity_tiles: homepage membacanya
-- lewat /api/home (drizzle, koneksi server langsung) dan tulisnya lewat
-- /api/admin/promo-banners (juga drizzle). Database dev lokal tidak punya
-- role anon/authenticated, jadi policy untuk role itu tidak dibuat di sini.
alter table public.promo_banners enable row level security;

-- ---------------------------------------------------------------------
-- 2. Bucket Storage untuk file gambar banner
-- ---------------------------------------------------------------------
-- Sama seperti bucket activities: upload server-side (service role), jadi
-- yang dibutuhkan hanya policy baca untuk halaman publik.
do $$
begin
  if not exists (select 1 from pg_namespace where nspname = 'storage') then
    return;
  end if;

  insert into storage.buckets (id, name, public)
  values ('promo-banners', 'promo-banners', true)
  on conflict (id) do nothing;

  drop policy if exists "promo banners read" on storage.objects;
  create policy "promo banners read" on storage.objects
    for select to anon, authenticated
    using (bucket_id = 'promo-banners');
end $$;
