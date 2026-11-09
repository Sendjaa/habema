-- =====================================================================
-- Habema — Ulasan untuk produk toko (shop_products)
-- =====================================================================
-- Tabel `reviews` sebelumnya hanya terikat ke `equipment` (rental), sehingga
-- produk toko tidak bisa punya ulasan. Migrasi ini menambahkan kolom
-- `shop_product_id`; `equipment_id` dibuat nullable karena satu ulasan hanya
-- menunjuk ke salah satu jenis produk.
--
-- IDEMPOTEN: aman dijalankan ulang.
-- =====================================================================

alter table public.reviews
  add column if not exists shop_product_id uuid;

-- Ulasan produk toko tidak punya equipment_id.
alter table public.reviews
  alter column equipment_id drop not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'reviews_shop_product_id_fkey'
  ) then
    alter table public.reviews
      add constraint reviews_shop_product_id_fkey
      foreign key (shop_product_id) references public.shop_products (id)
      on delete cascade;
  end if;
end $$;

create index if not exists idx_reviews_shop_product_id
  on public.reviews (shop_product_id);

-- Setiap ulasan harus menunjuk ke salah satu produk. NOT VALID agar baris
-- lama (jika ada yang tidak lengkap) tidak menggagalkan migrasi.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'reviews_target_check'
  ) then
    alter table public.reviews
      add constraint reviews_target_check
      check (equipment_id is not null or shop_product_id is not null) not valid;
  end if;
end $$;
