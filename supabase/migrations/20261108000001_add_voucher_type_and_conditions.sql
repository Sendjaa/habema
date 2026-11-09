-- =====================================================================
-- Habema — Tambah voucher_type dan conditions ke tabel discounts
-- =====================================================================
-- voucher_type: membatasi penggunaan voucher untuk kategori tertentu
--   - 'all' = bisa dipakai untuk semua (rental, shop, opentrip)
--   - 'rental' = hanya untuk rental equipment
--   - 'shop' = hanya untuk shop_products (beli produk)
--   - 'opentrip' = hanya untuk open trip
-- conditions: JSONB untuk syarat khusus, contoh:
--   - {"must_invite_friends": true, "min_friends": 3}
--   - {"first_time_only": true}
--   - {"requires_identity_verified": true}
-- =====================================================================

alter table public.discounts 
  add column if not exists voucher_type text not null default 'all';

alter table public.discounts 
  add column if not exists conditions jsonb default '{}'::jsonb;

-- Check constraint: voucher_type harus 'all', 'rental', 'shop', atau 'opentrip'
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'discounts_voucher_type_check') then
    alter table public.discounts
      add constraint discounts_voucher_type_check
      check (voucher_type in ('all', 'rental', 'shop', 'opentrip'));
  end if;
end;
$$;

-- Index untuk query berdasarkan voucher_type
create index if not exists idx_discounts_voucher_type on public.discounts (voucher_type);

-- Comment
comment on column public.discounts.voucher_type is 'all=semua, rental=sewa alat, shop=beli produk, opentrip=open trip';
comment on column public.discounts.conditions is 'JSON conditions: {must_invite_friends: bool, min_friends: int, first_time_only: bool, requires_identity_verified: bool}';

-- Update trigger to include updated_at
create trigger trg_set_updated_at_discounts before update on public.discounts
  for each row execute function public.set_updated_at();
