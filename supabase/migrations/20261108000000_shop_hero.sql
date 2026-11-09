-- Shop Hero: hero section "ShopProducts" di homepage
-- Hanya SATU baris aktif (single row), dikelola dari /admin/shop-hero

create table if not exists public.shop_hero (
  id uuid primary key default gen_random_uuid(),
  kicker text not null default 'Habema Official Store',
  heading text not null,
  description text not null,
  stats jsonb not null default '[]'::jsonb,
  cta_label text not null default 'Mulai Belanja',
  cta_href text not null default '/catalog_shop',
  secondary_cta_label text not null default 'Bundling Hemat',
  secondary_cta_href text not null default '/bundles',
  note text not null default 'Produk original dengan garansi tukar 7 hari. Pembayaran aman via Midtrans.',
  media jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Hanya boleh ada 1 baris aktif (enforced di aplikasi, bukan DB constraint)
-- Row-level security
alter table public.shop_hero enable row level security;

-- Admin (service role) full access
create policy "admin all" on public.shop_hero
  for all to service_role using (true) with check (true);

-- Anon hanya bisa baca yang aktif
create policy "anon read active" on public.shop_hero
  for select to anon using (is_active = true);

-- Trigger updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists set_shop_hero_updated_at on public.shop_hero;
create trigger set_shop_hero_updated_at
before update on public.shop_hero
for each row execute function public.set_updated_at();

-- Seed data awal (mirip lib/shop-hero.ts)
insert into public.shop_hero (
  kicker, heading, description, stats, cta_label, cta_href,
  secondary_cta_label, secondary_cta_href, note, media, is_active
) values (
  'Habema Official Store',
  'Gear Kuat Buat Jelajah Tanpa Ribet',
  'Tenda, carrier, cooking set, dan perlengkapan jalan lainnya kami pilih sendiri satu per satu. Tahan pakai, harga masuk, siap dikirim dari Bandung.',
  '[{"value": "500+", "label": "Kurasi Gear"}, {"value": "7 Hari", "label": "Garansi Tukar"}, {"value": "100%", "label": "Produk Original"}]'::jsonb,
  'Mulai Belanja', '/catalog_shop',
  'Bundling Hemat', '/bundles',
  'Produk original dengan garansi tukar 7 hari. Pembayaran aman via Midtrans.',
  '[
    {"url": "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1080&h=1350&fit=crop&q=80", "alt": "Tenda camping menyala di malam hari"},
    {"url": "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=1080&h=1350&fit=crop&q=80", "alt": "Api ungup pinggir tebing saat berkemah"},
    {"url": "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1080&h=1350&fit=crop&q=80", "alt": "Berselancar jalur pendakian"}
  ]'::jsonb,
  true
) on conflict do nothing;