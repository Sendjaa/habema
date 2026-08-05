-- =====================================================================
-- Habema — Tabel order belanja (shop_products)
-- =====================================================================
-- Menyimpan order dari toko (bukan rental). Satu order dapat berisi
-- banyak item (shop_order_items) dan terhubung ke transaksi Midtrans.
-- =====================================================================

create table if not exists public.shop_orders (id uuid primary key default gen_random_uuid());

alter table public.shop_orders add column if not exists user_id        uuid;
alter table public.shop_orders add column if not exists status         text not null default 'pending';
alter table public.shop_orders add column if not exists payment_status text not null default 'pending';

alter table public.shop_orders add column if not exists customer_name  text not null;
alter table public.shop_orders add column if not exists phone          text not null;
alter table public.shop_orders add column if not exists email          text;
alter table public.shop_orders add column if not exists address        text not null;
alter table public.shop_orders add column if not exists city           text;
alter table public.shop_orders add column if not exists postal_code    text;
alter table public.shop_orders add column if not exists note           text;

alter table public.shop_orders add column if not exists subtotal       numeric(14,2) not null default 0;
alter table public.shop_orders add column if not exists discount_amount numeric(14,2) not null default 0;
alter table public.shop_orders add column if not exists delivery_cost  numeric(14,2) not null default 0;
alter table public.shop_orders add column if not exists total_amount   numeric(14,2) not null default 0;

alter table public.shop_orders add column if not exists order_id       text;
alter table public.shop_orders add column if not exists midtrans_token text;
alter table public.shop_orders add column if not exists payment_method text;

alter table public.shop_orders add column if not exists created_at     timestamptz not null default now();
alter table public.shop_orders add column if not exists updated_at     timestamptz not null default now();

-- Item per order
create table if not exists public.shop_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.shop_orders(id) on delete cascade,
  product_id uuid not null,
  name text not null,
  price numeric(14,2) not null,
  quantity integer not null,
  total numeric(14,2) not null
);

create index if not exists idx_shop_orders_user on public.shop_orders (user_id);
create index if not exists idx_shop_order_items_order on public.shop_order_items (order_id);

-- Trigger updated_at
drop trigger if exists trg_set_updated_at_shop_orders on public.shop_orders;
create trigger trg_set_updated_at_shop_orders
  before update on public.shop_orders
  for each row execute function public.set_updated_at();

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.shop_orders enable row level security;
alter table public.shop_order_items enable row level security;

drop policy if exists "read own shop_orders" on public.shop_orders;
create policy "read own shop_orders" on public.shop_orders
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "insert shop_orders" on public.shop_orders;
create policy "insert shop_orders" on public.shop_orders
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "read own shop_order_items" on public.shop_order_items;
create policy "read own shop_order_items" on public.shop_order_items
  for select to authenticated
  using (
    EXISTS (
      SELECT 1 FROM public.shop_orders so
      WHERE so.id = shop_order_items.order_id AND so.user_id = auth.uid()
    )
  );

drop policy if exists "insert shop_order_items" on public.shop_order_items;
create policy "insert shop_order_items" on public.shop_order_items
  for insert to authenticated with check (
    EXISTS (
      SELECT 1 FROM public.shop_orders so
      WHERE so.id = shop_order_items.order_id AND so.user_id = auth.uid()
    )
  );
