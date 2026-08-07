-- =====================================================================
-- Habema — Multi-cabang (branches + branch_inventory)
-- =====================================================================
-- Pendekatan B: katalog tetap global; cabang dipilih saat checkout.
-- Stok dipecah per cabang lewat tabel branch_inventory agar tiap cabang
-- bisa memeriksa ketersediaannya sendiri (mencegah overbooking).
-- Mendukung cross-branch return: bookings.pickup_branch_id (ambil di A)
-- dan bookings.return_branch_id (kembali di B).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tabel cabang
-- ---------------------------------------------------------------------
create table if not exists public.branches (id uuid primary key default gen_random_uuid());

alter table public.branches add column if not exists name              text not null;
alter table public.branches add column if not exists address           text;
alter table public.branches add column if not exists city              text;
alter table public.branches add column if not exists phone             text;
alter table public.branches add column if not exists operational_hours text;
alter table public.branches add column if not exists map_url           text;
alter table public.branches add column if not exists is_active         boolean not null default true;
alter table public.branches add column if not exists created_at        timestamptz not null default now();
alter table public.branches add column if not exists updated_at        timestamptz not null default now();

-- Supaya seed idempoten
create unique index if not exists uq_branches_name on public.branches (lower(name));

-- ---------------------------------------------------------------------
-- Tabel stok per cabang
-- ---------------------------------------------------------------------
create table if not exists public.branch_inventory (id uuid primary key default gen_random_uuid());

alter table public.branch_inventory add column if not exists branch_id   uuid not null;
alter table public.branch_inventory add column if not exists equipment_id uuid not null;
alter table public.branch_inventory add column if not exists quantity    integer not null default 0;
alter table public.branch_inventory add column if not exists updated_at  timestamptz not null default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'branch_inventory_branch_id_fkey') then
    alter table public.branch_inventory
      add constraint branch_inventory_branch_id_fkey
      foreign key (branch_id) references public.branches (id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'branch_inventory_equipment_id_fkey') then
    alter table public.branch_inventory
      add constraint branch_inventory_equipment_id_fkey
      foreign key (equipment_id) references public.equipment (id) on delete cascade;
  end if;
end $$;

create unique index if not exists uq_branch_inventory
  on public.branch_inventory (branch_id, equipment_id);
create index if not exists idx_branch_inventory_equipment
  on public.branch_inventory (equipment_id);

-- ---------------------------------------------------------------------
-- Kolom cabang pada bookings (pengambilan & pengembalian)
-- ---------------------------------------------------------------------
alter table public.bookings add column if not exists pickup_branch_id   uuid;
alter table public.bookings add column if not exists return_branch_id   uuid;
alter table public.bookings add column if not exists pickup_branch_name text;
alter table public.bookings add column if not exists return_branch_name text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'bookings_pickup_branch_id_fkey') then
    alter table public.bookings
      add constraint bookings_pickup_branch_id_fkey
      foreign key (pickup_branch_id) references public.branches (id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'bookings_return_branch_id_fkey') then
    alter table public.bookings
      add constraint bookings_return_branch_id_fkey
      foreign key (return_branch_id) references public.branches (id) on delete set null;
  end if;
end $$;

create index if not exists idx_bookings_pickup_branch on public.bookings (pickup_branch_id);
create index if not exists idx_bookings_return_branch on public.bookings (return_branch_id);

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.branches enable row level security;
alter table public.branch_inventory enable row level security;

drop policy if exists "public read branches" on public.branches;
create policy "public read branches" on public.branches
  for select using (true);

drop policy if exists "public read branch_inventory" on public.branch_inventory;
create policy "public read branch_inventory" on public.branch_inventory
  for select using (true);

-- GRANT: anon/authenticated cukup SELECT (katalog), service_role full akses
grant select on public.branches to anon, authenticated;
grant select on public.branch_inventory to anon, authenticated;
grant select, insert, update, delete on public.branches to service_role;
grant select, insert, update, delete on public.branch_inventory to service_role;

-- =====================================================================
-- Seed: 3 cabang (idempoten)
-- =====================================================================
insert into public.branches (name, address, city, phone, operational_hours, map_url)
values
  ('Habema Cihanjuang (Basecamp Utama)',
   'Jl. Raya Cihanjuang No. 123, Cihanjuang, Parongpong',
   'Bandung Barat',
   '0812-2000-1001',
   '08.00 - 20.00 WIB',
   'https://maps.google.com/?q=Jl.+Raya+Cihanjuang+Parongpong'),
  ('Habema Bandung Kota',
   'Jl. Merdeka No. 45, Sumur Bandung',
   'Bandung',
   '0812-2000-1002',
   '08.00 - 20.00 WIB',
   'https://maps.google.com/?q=Jl.+Merdeka+Bandung'),
  ('Habema Lembang',
   'Jl. Raya Lembang No. 89, Lembang',
   'Bandung Barat',
   '0812-2000-1003',
   '08.00 - 20.00 WIB',
   'https://maps.google.com/?q=Jl.+Raya+Lembang')
on conflict (lower(name)) do nothing;

-- =====================================================================
-- Seed: alokasikan stok equipment ke tiap cabang (idempoten)
-- ----------------------------------------------------------------
-- Bagi stok_quantity global secara merata ke 3 cabang; sisa (remainder)
-- dialokasikan ke cabang utama (Cihanjuang). Nilai ini bisa diubah admin
-- lewat Supabase/dashboard.
-- =====================================================================
insert into public.branch_inventory (branch_id, equipment_id, quantity)
select b.id, e.id, floor(e.stock_quantity / 3)
from public.branches b
cross join public.equipment e
on conflict (branch_id, equipment_id) do nothing;

update public.branch_inventory bi
set quantity = quantity + (e.stock_quantity % 3)
from public.equipment e, public.branches b
where bi.equipment_id = e.id
  and bi.branch_id = b.id
  and b.name = 'Habema Cihanjuang (Basecamp Utama)'
  and e.stock_quantity % 3 <> 0;
