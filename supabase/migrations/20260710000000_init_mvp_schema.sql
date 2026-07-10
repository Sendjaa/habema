-- =====================================================================
-- Habema — Migrasi Init/Selaras Skema MVP  (IDEMPOTEN)
-- =====================================================================
-- Aman dijalankan pada database KOSONG maupun yang SUDAH berisi tabel.
-- Pola: `create table if not exists` (kolom id saja) lalu
--       `alter table ... add column if not exists` untuk tiap kolom.
-- Jadi kolom yang belum ada akan ditambahkan tanpa merusak data lama.
--
-- Catatan skema:
-- * equipment punya price_per_day (dipakai admin) DAN price_per_night
--   (dipakai route Midtrans & katalog). Keduanya disediakan.
-- * equipment punya `category` (teks admin) DAN `category_id` (FK katalog).
-- * bookings.midtrans_order_id & payment_status diantisipasi route Midtrans.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------
create table if not exists public.users (id uuid primary key default gen_random_uuid());
alter table public.users add column if not exists email           text;
alter table public.users add column if not exists full_name       text;
alter table public.users add column if not exists phone           text;
alter table public.users add column if not exists last_sign_in_at timestamptz;
alter table public.users add column if not exists created_at       timestamptz not null default now();
alter table public.users add column if not exists updated_at       timestamptz not null default now();

-- ---------------------------------------------------------------------
-- equipment_categories
-- ---------------------------------------------------------------------
create table if not exists public.equipment_categories (id uuid primary key default gen_random_uuid());
alter table public.equipment_categories add column if not exists name          text;
alter table public.equipment_categories add column if not exists description   text;
alter table public.equipment_categories add column if not exists display_order integer not null default 0;
alter table public.equipment_categories add column if not exists created_at    timestamptz not null default now();

create index if not exists idx_equipment_categories_display_order
  on public.equipment_categories (display_order);

-- ---------------------------------------------------------------------
-- equipment
-- ---------------------------------------------------------------------
create table if not exists public.equipment (id uuid primary key default gen_random_uuid());
alter table public.equipment add column if not exists name            text;
alter table public.equipment add column if not exists description     text;
alter table public.equipment add column if not exists price_per_day   numeric(12,2) not null default 0;
alter table public.equipment add column if not exists price_per_night numeric(12,2) not null default 0;
alter table public.equipment add column if not exists stock_quantity  integer not null default 0;
alter table public.equipment add column if not exists category        text;
alter table public.equipment add column if not exists category_id     uuid;
alter table public.equipment add column if not exists brand           text;
alter table public.equipment add column if not exists capacity        text;
alter table public.equipment add column if not exists image_url       text;
alter table public.equipment add column if not exists is_available    boolean not null default true;
alter table public.equipment add column if not exists created_at      timestamptz not null default now();
alter table public.equipment add column if not exists updated_at      timestamptz not null default now();

-- FK equipment.category_id -> equipment_categories.id (buat bila belum ada)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'equipment_category_id_fkey'
  ) then
    alter table public.equipment
      add constraint equipment_category_id_fkey
      foreign key (category_id) references public.equipment_categories (id) on delete set null;
  end if;
end;
$$;

create index if not exists idx_equipment_category_id on public.equipment (category_id);
create index if not exists idx_equipment_is_available on public.equipment (is_available);

-- ---------------------------------------------------------------------
-- bundles
-- ---------------------------------------------------------------------
create table if not exists public.bundles (id uuid primary key default gen_random_uuid());
alter table public.bundles add column if not exists name            text;
alter table public.bundles add column if not exists description     text not null default '';
alter table public.bundles add column if not exists target_audience text;
alter table public.bundles add column if not exists bundle_price    numeric(12,2);
alter table public.bundles add column if not exists original_price  numeric(12,2);
alter table public.bundles add column if not exists image_url       text;
alter table public.bundles add column if not exists is_active       boolean not null default true;
alter table public.bundles add column if not exists created_at      timestamptz not null default now();
alter table public.bundles add column if not exists updated_at      timestamptz not null default now();

create index if not exists idx_bundles_is_active on public.bundles (is_active);

-- ---------------------------------------------------------------------
-- bookings
-- ---------------------------------------------------------------------
create table if not exists public.bookings (id uuid primary key default gen_random_uuid());
alter table public.bookings add column if not exists user_id           uuid;
alter table public.bookings add column if not exists start_date        timestamptz;
alter table public.bookings add column if not exists end_date          timestamptz;
alter table public.bookings add column if not exists pickup_date       timestamptz;
alter table public.bookings add column if not exists status            text not null default 'pending';
alter table public.bookings add column if not exists delivery_option   text not null default 'pickup';
alter table public.bookings add column if not exists delivery_address  text;
alter table public.bookings add column if not exists delivery_cost     numeric(12,2) default 0;
alter table public.bookings add column if not exists customer_note     text;
alter table public.bookings add column if not exists subtotal          numeric(12,2) not null default 0;
alter table public.bookings add column if not exists deposit_amount    numeric(12,2) not null default 0;
alter table public.bookings add column if not exists total_cost        numeric(12,2) not null default 0;
alter table public.bookings add column if not exists rental_days       integer not null default 1;
alter table public.bookings add column if not exists midtrans_order_id text;
alter table public.bookings add column if not exists payment_status    text;
alter table public.bookings add column if not exists created_at        timestamptz not null default now();
alter table public.bookings add column if not exists updated_at        timestamptz not null default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'bookings_user_id_fkey') then
    alter table public.bookings
      add constraint bookings_user_id_fkey
      foreign key (user_id) references public.users (id) on delete set null;
  end if;
end;
$$;

create index if not exists idx_bookings_user_id on public.bookings (user_id);
create index if not exists idx_bookings_status on public.bookings (status);
create index if not exists idx_bookings_midtrans_order_id on public.bookings (midtrans_order_id);

-- ---------------------------------------------------------------------
-- booking_items
-- ---------------------------------------------------------------------
create table if not exists public.booking_items (id uuid primary key default gen_random_uuid());
alter table public.booking_items add column if not exists booking_id   uuid;
alter table public.booking_items add column if not exists equipment_id uuid;
alter table public.booking_items add column if not exists quantity     integer not null default 1;
alter table public.booking_items add column if not exists unit_price   numeric(12,2) not null default 0;
alter table public.booking_items add column if not exists subtotal     numeric(12,2) not null default 0;
alter table public.booking_items add column if not exists created_at   timestamptz not null default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'booking_items_booking_id_fkey') then
    alter table public.booking_items
      add constraint booking_items_booking_id_fkey
      foreign key (booking_id) references public.bookings (id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'booking_items_equipment_id_fkey') then
    alter table public.booking_items
      add constraint booking_items_equipment_id_fkey
      foreign key (equipment_id) references public.equipment (id) on delete set null;
  end if;
end;
$$;

create index if not exists idx_booking_items_booking_id on public.booking_items (booking_id);
create index if not exists idx_booking_items_equipment_id on public.booking_items (equipment_id);

-- ---------------------------------------------------------------------
-- user_identity
-- ---------------------------------------------------------------------
create table if not exists public.user_identity (id uuid primary key default gen_random_uuid());
alter table public.user_identity add column if not exists user_id             uuid;
alter table public.user_identity add column if not exists id_type             text;
alter table public.user_identity add column if not exists id_number           text;
alter table public.user_identity add column if not exists id_photo_url        text;
alter table public.user_identity add column if not exists verification_status text not null default 'pending';
alter table public.user_identity add column if not exists created_at          timestamptz not null default now();
alter table public.user_identity add column if not exists updated_at          timestamptz not null default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'user_identity_user_id_fkey') then
    alter table public.user_identity
      add constraint user_identity_user_id_fkey
      foreign key (user_id) references public.users (id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'user_identity_user_id_key') then
    alter table public.user_identity add constraint user_identity_user_id_key unique (user_id);
  end if;
end;
$$;

create index if not exists idx_user_identity_user_id on public.user_identity (user_id);

-- ---------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------
create table if not exists public.notifications (id uuid primary key default gen_random_uuid());
alter table public.notifications add column if not exists user_id           uuid;
alter table public.notifications add column if not exists title             text;
alter table public.notifications add column if not exists message           text;
alter table public.notifications add column if not exists notification_type text;
alter table public.notifications add column if not exists is_read           boolean not null default false;
alter table public.notifications add column if not exists metadata          jsonb not null default '{}'::jsonb;
alter table public.notifications add column if not exists created_at        timestamptz not null default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'notifications_user_id_fkey') then
    alter table public.notifications
      add constraint notifications_user_id_fkey
      foreign key (user_id) references public.users (id) on delete cascade;
  end if;
end;
$$;

create index if not exists idx_notifications_user_id on public.notifications (user_id);
create index if not exists idx_notifications_is_read on public.notifications (is_read);

-- ---------------------------------------------------------------------
-- addresses
-- ---------------------------------------------------------------------
create table if not exists public.addresses (id uuid primary key default gen_random_uuid());
alter table public.addresses add column if not exists user_id    uuid;
alter table public.addresses add column if not exists label      text;
alter table public.addresses add column if not exists recipient  text;
alter table public.addresses add column if not exists phone      text;
alter table public.addresses add column if not exists address    text;
alter table public.addresses add column if not exists is_default boolean not null default false;
alter table public.addresses add column if not exists created_at timestamptz not null default now();
alter table public.addresses add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'addresses_user_id_fkey') then
    alter table public.addresses
      add constraint addresses_user_id_fkey
      foreign key (user_id) references public.users (id) on delete cascade;
  end if;
end;
$$;

create index if not exists idx_addresses_user_id on public.addresses (user_id);

-- ---------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------
create table if not exists public.reviews (id uuid primary key default gen_random_uuid());
alter table public.reviews add column if not exists equipment_id uuid;
alter table public.reviews add column if not exists user_id      uuid;
alter table public.reviews add column if not exists rating       integer;
alter table public.reviews add column if not exists comment      text;
alter table public.reviews add column if not exists created_at   timestamptz not null default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'reviews_rating_check') then
    alter table public.reviews add constraint reviews_rating_check check (rating between 1 and 5);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'reviews_equipment_id_fkey') then
    alter table public.reviews
      add constraint reviews_equipment_id_fkey
      foreign key (equipment_id) references public.equipment (id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'reviews_user_id_fkey') then
    alter table public.reviews
      add constraint reviews_user_id_fkey
      foreign key (user_id) references public.users (id) on delete set null;
  end if;
end;
$$;

create index if not exists idx_reviews_equipment_id on public.reviews (equipment_id);
create index if not exists idx_reviews_user_id on public.reviews (user_id);

-- =====================================================================
-- Trigger updated_at
-- =====================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'users', 'equipment', 'bundles', 'bookings', 'user_identity', 'addresses'
  ]
  loop
    execute format('drop trigger if exists trg_set_updated_at on public.%I;', t);
    execute format(
      'create trigger trg_set_updated_at before update on public.%I
         for each row execute function public.set_updated_at();', t
    );
  end loop;
end;
$$;

-- =====================================================================
-- Row Level Security (MVP): read publik untuk katalog; data user milik sendiri.
-- Tulis lewat service role (supabaseAdmin) yang mem-bypass RLS.
-- =====================================================================
alter table public.users                enable row level security;
alter table public.equipment_categories enable row level security;
alter table public.equipment            enable row level security;
alter table public.bundles              enable row level security;
alter table public.bookings             enable row level security;
alter table public.booking_items        enable row level security;
alter table public.user_identity        enable row level security;
alter table public.notifications        enable row level security;
alter table public.addresses            enable row level security;
alter table public.reviews              enable row level security;

drop policy if exists "public read equipment" on public.equipment;
create policy "public read equipment" on public.equipment for select using (true);

drop policy if exists "public read equipment_categories" on public.equipment_categories;
create policy "public read equipment_categories" on public.equipment_categories for select using (true);

drop policy if exists "public read bundles" on public.bundles;
create policy "public read bundles" on public.bundles for select using (true);

drop policy if exists "public read reviews" on public.reviews;
create policy "public read reviews" on public.reviews for select using (true);

drop policy if exists "own bookings" on public.bookings;
create policy "own bookings" on public.bookings for select using (auth.uid() = user_id);

drop policy if exists "own user_identity" on public.user_identity;
create policy "own user_identity" on public.user_identity for select using (auth.uid() = user_id);

drop policy if exists "own addresses" on public.addresses;
create policy "own addresses" on public.addresses for select using (auth.uid() = user_id);

drop policy if exists "own notifications" on public.notifications;
create policy "own notifications" on public.notifications for select using (auth.uid() = user_id);

-- =====================================================================
-- Seed: kategori equipment (hanya bila tabel masih kosong)
-- =====================================================================
insert into public.equipment_categories (name, description, display_order)
select * from (values
  ('Tenda',        'Berbagai jenis tenda untuk camping', 1),
  ('Sleeping Bag', 'Kantong tidur yang nyaman',          2),
  ('Carrier',      'Tas ransel untuk hiking',            3),
  ('Penerangan',   'Lampu & penerangan outdoor',         4),
  ('Masak',        'Peralatan memasak outdoor',          5),
  ('Navigasi',     'Alat navigasi & keselamatan',        6)
) as v(name, description, display_order)
where not exists (select 1 from public.equipment_categories);

-- =====================================================================
-- Seed: bundles (paket Open Trip) — hanya bila tabel masih kosong
-- =====================================================================
insert into public.bundles (name, description, target_audience, bundle_price, original_price, image_url, is_active)
select * from (values
  ('Open Trip Sunrise',
   'Saksikan matahari terbit dari puncak yang menakjubkan bersama rombongan seru. Keberangkatan setiap akhir pekan.',
   'Open Trip', 195000::numeric, null::numeric,
   'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80', true),
  ('Open Trip Tracking & Hutan',
   'Jelajahi jalur tracking ke puncak gunung atau lebatnya hutan bersama tim Habema. Cocok untuk solo traveler.',
   'Open Trip', 225000, null,
   'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80', true),
  ('Open Trip Explorer Wisata',
   'Eksplorasi wisata daerah terpilih bersama komunitas satu visi. Perjalanan 3 hari 2 malam penuh kenangan.',
   'Open Trip', 275000, null,
   'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', true),
  ('Paket Camping Keluarga',
   'Paket sewa alat lengkap untuk keluarga besar. Kami urus semua perlengkapan, kamu fokus menikmati alam.',
   'Camping Keluarga', 700000, 850000,
   'https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?w=800&q=80', true),
  ('Paket Camping Komunitas',
   'Ideal untuk kelompok kecil hingga menengah. Nikmati suasana berkemah dengan semua alat siap pakai.',
   'Camping Keluarga', 600000, null,
   'https://images.unsplash.com/photo-1499363536502-87642509e31b?w=800&q=80', true),
  ('Private Camp Eksklusif',
   'Area camping privat untuk organisasi, komunitas, sekolah, atau kampus. Setup eksklusif dengan nuansa alami.',
   'Private Camp', null, null,
   'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80', true),
  ('Campervan Akhir Pekan',
   '3 hari 2 malam petualangan seru dengan campervan. Kebebasan menjelajah daerah wisata pilihan Anda.',
   'Campervan', 1200000, null,
   'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=800&q=80', true),
  ('Campervan Explorer Wisata',
   'Jelajahi wisata daerah dan tracking ke puncak gunung atau hutan dengan campervan yang fully equipped.',
   'Campervan', null, null,
   'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80', true)
) as v(name, description, target_audience, bundle_price, original_price, image_url, is_active)
where not exists (select 1 from public.bundles);
