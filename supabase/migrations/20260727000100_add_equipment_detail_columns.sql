-- =====================================================================
-- Habema — Tambah kolom detail equipment (gallery, spesifikasi, dll)
-- =====================================================================
-- Kolom yang ditambahkan agar sesuai dengan form admin lengkap:
--   gallery_urls, detailed_description, specifications, vendor_id,
--   weight_kg, dimensions, material, weather_rating,
--   rental_count, average_rating, is_active
-- =====================================================================

alter table public.equipment add column if not exists detailed_description text;
alter table public.equipment add column if not exists gallery_urls         text[] not null default array[]::text[];
alter table public.equipment add column if not exists specifications       jsonb;
alter table public.equipment add column if not exists vendor_id            uuid;
alter table public.equipment add column if not exists weight_kg            numeric(8,2);
alter table public.equipment add column if not exists dimensions           text;
alter table public.equipment add column if not exists material             text;
alter table public.equipment add column if not exists weather_rating       text;
alter table public.equipment add column if not exists rental_count         integer not null default 0;
alter table public.equipment add column if not exists average_rating       numeric(3,2) not null default 0;
alter table public.equipment add column if not exists is_active            boolean not null default true;

-- FK vendor_id -> users
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'equipment_vendor_id_fkey'
  ) then
    alter table public.equipment
      add constraint equipment_vendor_id_fkey
      foreign key (vendor_id) references public.users (id) on delete cascade;
  end if;
end;
$$;
