-- =====================================================================
-- Habema — Tabel diskon / promo
-- =====================================================================
-- Mendukung diskon persentase atau nominal (fixed).
-- Berlaku untuk semua produk, kategori tertentu, atau produk tertentu.
-- Batas penggunaan opsional (per kode diskon secara keseluruhan).
-- =====================================================================

create table if not exists public.discounts (id uuid primary key default gen_random_uuid());

alter table public.discounts add column if not exists code            text not null;
alter table public.discounts add column if not exists description     text;
alter table public.discounts add column if not exists discount_type   text not null default 'percentage';
alter table public.discounts add column if not exists discount_value  numeric(12,2) not null default 0;
alter table public.discounts add column if not exists min_purchase    numeric(12,2) default 0;
alter table public.discounts add column if not exists max_discount    numeric(12,2);
alter table public.discounts add column if not exists start_date      timestamptz;
alter table public.discounts add column if not exists end_date        timestamptz;
alter table public.discounts add column if not exists is_active       boolean not null default true;
alter table public.discounts add column if not exists applies_to      text not null default 'all';
alter table public.discounts add column if not exists target_id       uuid;
alter table public.discounts add column if not exists usage_limit     integer;
alter table public.discounts add column if not exists usage_count     integer not null default 0;
alter table public.discounts add column if not exists created_at      timestamptz not null default now();
alter table public.discounts add column if not exists updated_at      timestamptz not null default now();

-- Unique constraint pada kode diskon
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'discounts_code_key') then
    alter table public.discounts add constraint discounts_code_key unique (code);
  end if;
end;
$$;

-- Check constraint: discount_type harus 'percentage' atau 'fixed'
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'discounts_discount_type_check') then
    alter table public.discounts
      add constraint discounts_discount_type_check
      check (discount_type in ('percentage', 'fixed'));
  end if;
end;
$$;

-- Check constraint: applies_to harus 'all', 'category', atau 'equipment'
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'discounts_applies_to_check') then
    alter table public.discounts
      add constraint discounts_applies_to_check
      check (applies_to in ('all', 'category', 'equipment'));
  end if;
end;
$$;

-- Indexes
create index if not exists idx_discounts_code on public.discounts (code);
create index if not exists idx_discounts_is_active on public.discounts (is_active);
create index if not exists idx_discounts_start_end on public.discounts (start_date, end_date);
create index if not exists idx_discounts_applies_to on public.discounts (applies_to, target_id);

-- Trigger updated_at
create trigger trg_set_updated_at before update on public.discounts
  for each row execute function public.set_updated_at();

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.discounts enable row level security;

-- Publik hanya bisa membaca diskon yang aktif & belum kedaluwarsa
drop policy if exists "public read active discounts" on public.discounts;
create policy "public read active discounts" on public.discounts
  for select to anon, authenticated
  using (
    is_active = true
    and (start_date is null or start_date <= now())
    and (end_date is null or end_date >= now())
  );

-- Admin (service role) mengelola semua operasi lewat supabaseAdmin
