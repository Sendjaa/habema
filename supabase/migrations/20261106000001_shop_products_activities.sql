-- =====================================================================
-- Habema — Kegiatan di produk toko (shop_products.activities)
-- IDEMPOTEN: aman dijalankan ulang.
--
-- "Kegiatan" selama ini hanya melekat di alat sewa (equipment.activities,
-- migrasi 20261104000000), jadi halaman /kegiatan/<slug> cuma bisa
-- menampilkan barang sewa. Kolom ini membuat sisi beli ikut terbaca dengan
-- kosakata yang sama — kompor portable, headlamp, dry bag: barang yang
-- orang lebih sering beli daripada sewa.
--
-- Sama seperti di equipment: isinya slug dari lib/activities.ts, nilainya
-- divalidasi di /api/admin/catalog-shop, dan penyaringan dilakukan di DB
-- lewat index GIN (`activities && ARRAY[...]`), bukan di browser.
-- =====================================================================

alter table public.shop_products
  add column if not exists activities text[] not null default array[]::text[];

comment on column public.shop_products.activities is
  'Slug kegiatan dari lib/activities.ts, mis. {pendakian,campervan}; kosong = tidak tampil di halaman kegiatan';

create index if not exists shop_products_activities_gin
  on public.shop_products using gin (activities);
