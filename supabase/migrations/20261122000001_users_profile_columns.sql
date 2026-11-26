alter table public.users add column if not exists address text;
alter table public.users add column if not exists city text;
alter table public.users add column if not exists postal_code text;
alter table public.users add column if not exists profile_image_url text;
alter table public.users add column if not exists vendor_name text;
alter table public.users add column if not exists vendor_description text;
