-- Referral & Coin System Migration
-- Adds referral_code, referral_count, coin_balance to public.users

alter table public.users add column if not exists referral_code text;
alter table public.users add column if not exists referral_count integer not null default 0;
alter table public.users add column if not exists coin_balance integer not null default 0;
alter table public.users add column if not exists referred_by uuid;
alter table public.users add column if not exists referral_rewarded boolean not null default false;

create index if not exists idx_users_referral_code on public.users (referral_code) where referral_code is not null;
create index if not exists idx_users_referred_by on public.users (referred_by);

create table if not exists public.coin_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('earn', 'redeem')),
  amount integer not null,
  description text not null,
  reference_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_coin_transactions_user_id on public.coin_transactions (user_id);
create index if not exists idx_coin_transactions_created_at on public.coin_transactions (created_at desc);

create table if not exists public.redeemed_vouchers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  voucher_id text not null,
  promo_code text not null,
  title text not null,
  discount_text text not null,
  coin_cost integer not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_redeemed_vouchers_user_id on public.redeemed_vouchers (user_id);

comment on column public.users.referral_code is 'Kode referral unik untuk undangan teman';
comment on column public.users.referral_count is 'Jumlah teman yang bergabung melalui kode referral';
comment on column public.users.coin_balance is 'Saldo koin cashback untuk tukar voucher';
comment on column public.users.referred_by is 'User yang mengundang (jika ada)';
comment on column public.users.referral_rewarded is 'Apakah hadiah referral sudah dibagikan';
