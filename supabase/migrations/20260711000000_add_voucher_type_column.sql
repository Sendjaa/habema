-- =====================================================================
-- Habema — Kolom voucher_type di tabel discounts
-- =====================================================================
-- Menambahkan kolom voucher_type untuk menjenis voucher (shop/rental/opentrip).
-- Nilai default 'all' jika belum diisi.
-- =====================================================================

alter table public.discounts add column if not exists voucher_type text not null default 'all';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'discounts_voucher_type_check'
  ) then
    alter table public.discounts
      add constraint discounts_voucher_type_check
      check (voucher_type in ('all', 'shop', 'rental', 'opentrip'));
  end if;
end $$;