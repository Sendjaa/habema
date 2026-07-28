-- =====================================================================
-- Habema — Tabel shop_products (produk jual, bukan rental)
-- =====================================================================
-- Tabel terpisah dari `equipment` yang khusus untuk rental.
-- `shop_products` menyimpan produk yang dijual (beli, bukan sewa).
-- =====================================================================

create table if not exists public.shop_products (id uuid primary key default gen_random_uuid());
alter table public.shop_products add column if not exists name            text not null;
alter table public.shop_products add column if not exists description     text;
alter table public.shop_products add column if not exists price           numeric(12,2) not null default 0;
alter table public.shop_products add column if not exists original_price  numeric(12,2);
alter table public.shop_products add column if not exists stock           integer not null default 0;
alter table public.shop_products add column if not exists category        text;
alter table public.shop_products add column if not exists image_url       text;
alter table public.shop_products add column if not exists gallery_urls    jsonb not null default '[]'::jsonb;
alter table public.shop_products add column if not exists brand           text;
alter table public.shop_products add column if not exists specifications  jsonb not null default '{}'::jsonb;
alter table public.shop_products add column if not exists weight_kg       numeric(10,2);
alter table public.shop_products add column if not exists dimensions      text;
alter table public.shop_products add column if not exists material        text;
alter table public.shop_products add column if not exists is_available    boolean not null default true;
alter table public.shop_products add column if not exists is_featured     boolean not null default false;
alter table public.shop_products add column if not exists is_new          boolean not null default false;
alter table public.shop_products add column if not exists rating          numeric(3,2) not null default 0;
alter table public.shop_products add column if not exists review_count    integer not null default 0;
alter table public.shop_products add column if not exists sold_count      integer not null default 0;
alter table public.shop_products add column if not exists created_at      timestamptz not null default now();
alter table public.shop_products add column if not exists updated_at      timestamptz not null default now();

create index if not exists idx_shop_products_is_available on public.shop_products (is_available);
create index if not exists idx_shop_products_category on public.shop_products (category);
create index if not exists idx_shop_products_is_featured on public.shop_products (is_featured);

-- RLS: baca publik, tulis hanya service role
alter table public.shop_products enable row level security;

drop policy if exists "public read shop_products" on public.shop_products;
create policy "public read shop_products" on public.shop_products
  for select to anon, authenticated using (true);

drop policy if exists "admin insert shop_products" on public.shop_products;
create policy "admin insert shop_products" on public.shop_products
  for insert to authenticated with check (true);

drop policy if exists "admin update shop_products" on public.shop_products;
create policy "admin update shop_products" on public.shop_products
  for update to authenticated using (true) with check (true);

drop policy if exists "admin delete shop_products" on public.shop_products;
create policy "admin delete shop_products" on public.shop_products
  for delete to authenticated using (true);

-- Trigger updated_at
drop trigger if exists trg_set_updated_at_shop_products on public.shop_products;
create trigger trg_set_updated_at_shop_products
  before update on public.shop_products
  for each row execute function public.set_updated_at();
