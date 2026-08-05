-- =====================================================================
-- Habema — Add discount_id to shop_orders
-- =====================================================================
-- Menyimpan referensi voucher yang dipakai pada sebuah order shop.
-- Nilai diskon yang sebenarnya tetap dihitung dari tabel discounts
-- (diverifikasi server), kolom ini hanya untuk pelacakan/audit.
-- =====================================================================

alter table public.shop_orders
  add column if not exists discount_id uuid;

create index if not exists idx_shop_orders_discount
  on public.shop_orders (discount_id);
