-- =====================================================================
-- Habema — Paket Rental Grup (Berdua / Berempat / 6-7 / 10 orang)
-- IDEMPOTEN: aman dijalankan ulang.
-- - Lengkapi kolom bundles yang dipakai frontend tapi belum ada migrasinya
--   (includes, excludes, discount_percentage) + kolom baru pax_min/pax_max.
-- - Pastikan tabel bundle_items & booking_bundle_items ada (dipakai untuk
--   booking online + cek/kurang stok per equipment).
-- - Seed 4 paket grup dengan target_audience='Paket Rental Grup'.
--   bundle_price = harga PER PAKET PER MALAM (dikalikan rental_days saat booking).
--   bundle_items dikelola via admin (/admin/bundles) agar bisa dipetakan ke
--   equipment_id yang valid per katalog masing-masing environment.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Kolom bundles
-- ---------------------------------------------------------------------
alter table public.bundles add column if not exists includes jsonb not null default '[]'::jsonb;
alter table public.bundles add column if not exists excludes jsonb not null default '[]'::jsonb;
alter table public.bundles add column if not exists discount_percentage numeric(5,2);
alter table public.bundles add column if not exists pax_min integer;
alter table public.bundles add column if not exists pax_max integer;

-- ---------------------------------------------------------------------
-- 2. Tabel bundle_items (komposisi paket -> equipment)
-- ---------------------------------------------------------------------
create table if not exists public.bundle_items (
  id uuid primary key default gen_random_uuid(),
  bundle_id uuid not null references public.bundles (id) on delete cascade,
  equipment_id uuid not null references public.equipment (id) on delete restrict,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (bundle_id, equipment_id)
);
create index if not exists idx_bundle_items_bundle_id on public.bundle_items (bundle_id);
create index if not exists idx_bundle_items_equipment_id on public.bundle_items (equipment_id);

-- ---------------------------------------------------------------------
-- 3. Tabel booking_bundle_items (snapshot paket dalam booking)
-- ---------------------------------------------------------------------
create table if not exists public.booking_bundle_items (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  bundle_id uuid not null references public.bundles (id) on delete restrict,
  quantity integer not null default 1 check (quantity > 0),
  bundle_price numeric(12,2),
  subtotal numeric(12,2),
  created_at timestamptz not null default now()
);
create index if not exists idx_booking_bundle_items_booking_id on public.booking_bundle_items (booking_id);
create index if not exists idx_booking_bundle_items_bundle_id on public.booking_bundle_items (bundle_id);

-- ---------------------------------------------------------------------
-- 4. RLS
-- ---------------------------------------------------------------------
alter table public.bundle_items enable row level security;
alter table public.booking_bundle_items enable row level security;

drop policy if exists "public read bundle_items" on public.bundle_items;
create policy "public read bundle_items" on public.bundle_items for select using (true);

drop policy if exists "public read bundles" on public.bundles;
create policy "public read bundles" on public.bundles for select using (true);

-- booking_bundle_items hanya via service role (tidak ada policy select publik).
-- Beri grant agar service role bisa akses (konsisten dengan migrasi grant sebelumnya).
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant all on public.bundle_items to service_role;
    grant all on public.booking_bundle_items to service_role;
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- 5. Seed 4 paket grup (hanya bila nama belum ada)
-- ---------------------------------------------------------------------
-- Harga per paket per malam (asumsi standar, bisa diubah via /admin/bundles):
--   Berdua     Rp150.000 (coret 185.000)
--   Berempat   Rp250.000 (coret 310.000)
--   6-7 orang  Rp375.000 (coret 460.000)
--   10 orang   Rp520.000 (coret 650.000)

insert into public.bundles
  (name, description, target_audience, bundle_price, original_price, discount_percentage, image_url, is_active, includes, excludes, pax_min, pax_max)
select * from (values
  (
    'Paket Rental Berdua',
    'Paket hemat untuk 2 orang: tenda + sleeping bag + matras + cooking set + penerangan. Cocok untuk couple camp / pendakian ringan 2D1N.',
    'Paket Rental Grup',
    150000::numeric, 185000::numeric, 19::numeric,
    'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80',
    true,
    '["1 Tenda kap 4 orang", "2 Sleeping bag", "2 Matras", "1 Cooking set + kompor + gas", "2 Headlamp / lampu tenda", "1 Flysheet + tali & pasak"]'::jsonb,
    '["Tiket masuk kawasan", "Transportasi", "Konsumsi", "Ongkir luar kota"]'::jsonb,
    2, 2
  ),
  (
    'Paket Rental Berempat',
    'Paket favorit untuk 4 orang: 2 tenda + sleeping bag & matras per orang + cooking set lengkap. Pas untuk keluarga kecil / sahabat.',
    'Paket Rental Grup',
    250000::numeric, 310000::numeric, 19::numeric,
    'https://images.unsplash.com/photo-1499363536502-87642509e31b?w=800&q=80',
    true,
    '["2 Tenda kap 4 orang", "4 Sleeping bag", "4 Matras", "1 Cooking set besar + 2 kompor + gas", "4 Headlamp / lampu tenda", "1 Flysheet 3x4 + tiang", "Bongkar pasang tenda"]'::jsonb,
    '["Tiket masuk kawasan", "Transportasi", "Konsumsi", "Ongkir luar kota"]'::jsonb,
    4, 4
  ),
  (
    'Paket Rental 6-7 Orang',
    'Paket grup 6-7 orang: 2-3 tenda + sleeping system per orang + dapur umum + flysheet komunal. Ideal untuk komunitas kecil / camping keluarga besar.',
    'Paket Rental Grup',
    375000::numeric, 460000::numeric, 18::numeric,
    'https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?w=800&q=80',
    true,
    '["3 Tenda kap 4 orang", "7 Sleeping bag", "7 Matras", "2 Cooking set + 2 kompor + gas", "Flysheet 4x6 + tiang", "Lampu tenda & lampu area", "Bongkar pasang tenda"]'::jsonb,
    '["Tiket masuk kawasan", "Transportasi", "Konsumsi", "Ongkir luar kota"]'::jsonb,
    6, 7
  ),
  (
    'Paket Rental 10 Orang',
    'Paket rombongan 10 orang: 3-4 tenda + sleeping system lengkap + dapur umum ganda + area komunal. Untuk gathering, sekolah, / komunitas.',
    'Paket Rental Grup',
    520000::numeric, 650000::numeric, 20::numeric,
    'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800&q=80',
    true,
    '["4 Tenda kap 4 orang", "10 Sleeping bag", "10 Matras", "2 Cooking set besar + 3 kompor + gas", "Flysheet 4x6 + tiang", "Lampu tenda & lampu area", "Bongkar pasang + antar lokasi (area Bandung)"]'::jsonb,
    '["Tiket masuk kawasan", "Transportasi peserta", "Konsumsi", "Ongkir luar kota"]'::jsonb,
    10, 10
  )
) as v(name, description, target_audience, bundle_price, original_price, discount_percentage, image_url, is_active, includes, excludes, pax_min, pax_max)
where not exists (
  select 1 from public.bundles b where b.name = v.name
);
