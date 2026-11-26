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

create or replace function public.apply_referral_reward(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referrer uuid;
begin
  select referred_by into v_referrer from public.users where id = p_user_id for update;
  if v_referrer is null then
    return false;
  end if;

  update public.users
  set referral_rewarded = true,
      coin_balance = coin_balance + 250
  where id = p_user_id and referral_rewarded = false;

  if not found then
    return false;
  end if;

  update public.users
  set referral_count = referral_count + 1,
      coin_balance = coin_balance + 250
  where id = v_referrer;

  insert into public.coin_transactions (user_id, type, amount, description, reference_id)
  values (p_user_id, 'earn', 250, 'Bonus referral bergabung', p_user_id::text);

  insert into public.coin_transactions (user_id, type, amount, description, reference_id)
  values (v_referrer, 'earn', 250, 'Bonus referral teman bergabung', p_user_id::text);

  return true;
end;
$$;

create or replace function public.redeem_voucher(
  p_user_id uuid,
  p_voucher_id text,
  p_promo_code text,
  p_title text,
  p_discount_text text,
  p_coin_cost integer,
  p_valid_days integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
  v_id uuid;
  v_expires_at timestamptz;
begin
  select coin_balance into v_balance from public.users where id = p_user_id for update;

  if v_balance is null or v_balance < p_coin_cost then
    return jsonb_build_object('success', false, 'message', 'Koin tidak mencukupi');
  end if;

  v_id := gen_random_uuid();
  v_expires_at := now() + (p_valid_days || ' days')::interval;

  update public.users
  set coin_balance = coin_balance - p_coin_cost
  where id = p_user_id;

  insert into public.redeemed_vouchers (
    id, user_id, voucher_id, promo_code, title, discount_text, coin_cost, expires_at
  ) values (
    v_id, p_user_id, p_voucher_id, p_promo_code, p_title, p_discount_text, p_coin_cost, v_expires_at
  );

  insert into public.coin_transactions (user_id, type, amount, description, reference_id)
  values (p_user_id, 'redeem', p_coin_cost, p_title, v_id::text);

  return jsonb_build_object(
    'success', true,
    'voucher', jsonb_build_object(
      'id', v_id,
      'voucherId', p_voucher_id,
      'promoCode', p_promo_code,
      'title', p_title,
      'discountText', p_discount_text,
      'coinCost', p_coin_cost,
      'expiresAt', v_expires_at
    )
  );
end;
$$;
