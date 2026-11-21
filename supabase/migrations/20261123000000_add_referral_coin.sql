-- Referral & Coin System Migration
-- Adds referral_code, referral_count, coin_balance to public.users

alter table public.users add column if not exists referral_code text;
alter table public.users add column if not exists referral_count integer not null default 0;
alter table public.users add column if not exists coin_balance integer not null default 0;
alter table public.users add column if not exists referred_by uuid;

-- Unique index for referral_code
create index if not exists idx_users_referral_code on public.users (referral_code) where referral_code is not null;
create index if not exists idx_users_referred_by on public.users (referred_by);

-- Comment on columns
comment on column public.users.referral_code is 'Kode referral unik untuk undangan teman';
comment on column public.users.referral_count is 'Jumlah teman yang bergabung melalui kode referral';
comment on column public.users.coin_balance is 'Saldo koin cashback untuk tukar voucher';
comment on column public.users.referred_by is 'User yang mengundang (jika ada)';

-- RLS: users bisa baca data sendiri
-- (existing policies already cover select on own row)
