-- =====================================================================
-- Habema — Tambah kolom promo untuk equipment
-- =====================================================================
-- Menambahkan dukungan promo per-produk (diskon langsung di product card)
-- is_promo             : flag produk sedang promo
-- discount_percentage  : persentase diskon (misal 20.00 = 20%)
-- promo_price_per_night: harga promo per malam (bisa dihitung dari diskon%)
-- promo_start_date     : mulai promo
-- promo_end_date       : berakhir promo
-- =====================================================================

alter table public.equipment add column if not exists is_promo             boolean not null default false;
alter table public.equipment add column if not exists discount_percentage  numeric(5,2);
alter table public.equipment add column if not exists promo_price_per_night numeric(12,2);
alter table public.equipment add column if not exists promo_start_date     timestamptz;
alter table public.equipment add column if not exists promo_end_date       timestamptz;

create index if not exists idx_equipment_is_promo on public.equipment (is_promo)
  where is_promo = true;