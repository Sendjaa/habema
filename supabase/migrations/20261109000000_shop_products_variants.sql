-- Habema — Varian produk toko
-- Setiap produk bisa punya varian (ukuran, warna, dll.) dengan nama, tipe,
-- harga, stok, SKU, dan gambar sendiri. Total stok produk (kolom stock)
-- tetap dijumlahkan dari stok semua varian saat disimpan.

alter table public.shop_products
  add column if not exists has_variants boolean not null default false;

alter table public.shop_products
  add column if not exists variants jsonb not null default '[]'::jsonb;

comment on column public.shop_products.has_variants is
  'True bila produk dijual per varian (ukuran/warna). Stok per varian ada di kolom variants.';

comment on column public.shop_products.variants is
  'Array JSON varian: { name, type: size|color|other, price, stock, sku, image_url }.';

create index if not exists shop_products_has_variants_idx
  on public.shop_products (has_variants)
  where has_variants = true;
