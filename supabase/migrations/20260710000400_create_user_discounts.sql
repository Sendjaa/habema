-- =====================================================================
-- Habema — Tabel relasi user & diskon (klaim promo)
-- =====================================================================
-- Menyimpan record ketika user mengklaim kode diskon dari halaman bundles.
-- Satu user hanya boleh mengklaim satu kode diskon yang sama sekali.
-- =====================================================================

create table if not exists public.user_discounts (id uuid primary key default gen_random_uuid());

alter table public.user_discounts add column if not exists user_id     uuid not null;
alter table public.user_discounts add column if not exists discount_id uuid not null;
alter table public.user_discounts add column if not exists claimed_at  timestamptz not null default now();
alter table public.user_discounts add column if not exists used_at     timestamptz;

-- Unique: satu user hanya boleh klaim satu diskon yang sama
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'user_discounts_user_discount_key') then
    alter table public.user_discounts
      add constraint user_discounts_user_discount_key
      unique (user_id, discount_id);
  end if;
end;
$$;

-- FK -> discounts
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'user_discounts_discount_id_fkey') then
    alter table public.user_discounts
      add constraint user_discounts_discount_id_fkey
      foreign key (discount_id) references public.discounts (id) on delete cascade;
  end if;
end;
$$;

-- FK -> users
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'user_discounts_user_id_fkey') then
    alter table public.user_discounts
      add constraint user_discounts_user_id_fkey
      foreign key (user_id) references public.users (id) on delete cascade;
  end if;
end;
$$;

create index if not exists idx_user_discounts_user_id on public.user_discounts (user_id);
create index if not exists idx_user_discounts_discount_id on public.user_discounts (discount_id);

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.user_discounts enable row level security;

-- User hanya bisa membaca klaim miliknya sendiri
drop policy if exists "own user_discounts" on public.user_discounts;
create policy "own user_discounts" on public.user_discounts
  for select to authenticated using (auth.uid() = user_id);

-- User login bisa mengklaim diskon (insert milik sendiri)
drop policy if exists "insert own user_discounts" on public.user_discounts;
create policy "insert own user_discounts" on public.user_discounts
  for insert to authenticated with check (auth.uid() = user_id);

-- User bisa update used_at milik sendiri
drop policy if exists "update own user_discounts" on public.user_discounts;
create policy "update own user_discounts" on public.user_discounts
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Seed data diskon (hanya bila tabel discounts masih kosong)
insert into public.discounts (code, description, discount_type, discount_value, min_purchase, max_discount, start_date, end_date, is_active, applies_to)
select * from (values
  ('HABEMABARU',   'Diskon pengguna baru 10% untuk transaksi pertama',          'percentage', 10,  100000, 50000,  '2026-01-01'::timestamptz, '2026-12-31'::timestamptz, true, 'all'),
  ('WEEKENDSERU',  'Potongan Rp25.000 untuk sewa akhir pekan',                 'fixed',      25000, 0,     null,   null,                     null,                     true, 'all'),
  ('TRIP5PERTAMA', 'Diskon 10% untuk 5 pendaftar pertama open trip',           'percentage', 10,  0,     null,   null,                     null,                     true, 'all'),
  ('CAMPERVAN10',  'Diskon 10% untuk penyewa campervan pertama',               'percentage', 10,  0,     null,   null,                     null,                     true, 'all'),
  ('KOMUNITASHEMA','Diskon 15% untuk paket komunitas & sekolah',               'percentage', 15,  0,     null,   null,                     null,                     true, 'all'),
  ('AJAKTEMAN',    'Potongan Rp15.000 untuk kamu & teman',                     'fixed',      15000, 0,    null,   null,                     null,                     true, 'all')
) as v(code, description, discount_type, discount_value, min_purchase, max_discount, start_date, end_date, is_active, applies_to)
where not exists (select 1 from public.discounts);
