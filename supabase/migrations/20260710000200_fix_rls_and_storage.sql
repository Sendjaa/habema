-- =====================================================================
-- Habema — Perbaikan RLS (izin tulis) + Storage bucket id-documents
-- =====================================================================
-- Migrasi init sebelumnya mengaktifkan RLS namun hanya menambah policy
-- SELECT, sehingga seluruh INSERT/UPDATE dari client (anon/authenticated)
-- ditolak: "permission denied for table users" (42501).
--
-- Migrasi ini:
--   1. Memberi GRANT privilege tabel/sequence ke anon & authenticated.
--   2. Menambah policy INSERT/UPDATE/DELETE berbasis kepemilikan.
--   3. Membuat bucket Storage `id-documents` + policy upload/baca.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. GRANT privilege dasar (RLS tetap membatasi baris per policy)
-- ---------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. Policy tulis per tabel
-- ---------------------------------------------------------------------

-- users: baca publik (dibutuhkan join nama penulis review), tulis milik sendiri
drop policy if exists "public read users" on public.users;
create policy "public read users" on public.users
  for select to anon, authenticated using (true);

drop policy if exists "insert own user" on public.users;
create policy "insert own user" on public.users
  for insert to authenticated with check (auth.uid() = id);

drop policy if exists "update own user" on public.users;
create policy "update own user" on public.users
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- user_identity: milik sendiri
drop policy if exists "insert own user_identity" on public.user_identity;
create policy "insert own user_identity" on public.user_identity
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "update own user_identity" on public.user_identity;
create policy "update own user_identity" on public.user_identity
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- bookings: boleh dibuat user login (miliknya) atau tamu (user_id null)
drop policy if exists "insert bookings" on public.bookings;
create policy "insert bookings" on public.bookings
  for insert to anon, authenticated
  with check (user_id is null or auth.uid() = user_id);

drop policy if exists "update own bookings" on public.bookings;
create policy "update own bookings" on public.bookings
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- booking_items: permisif untuk MVP (tak punya kolom user_id sendiri)
drop policy if exists "read booking_items" on public.booking_items;
create policy "read booking_items" on public.booking_items
  for select to anon, authenticated using (true);

drop policy if exists "insert booking_items" on public.booking_items;
create policy "insert booking_items" on public.booking_items
  for insert to anon, authenticated with check (true);

-- addresses: milik sendiri
drop policy if exists "insert own addresses" on public.addresses;
create policy "insert own addresses" on public.addresses
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "update own addresses" on public.addresses;
create policy "update own addresses" on public.addresses
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "delete own addresses" on public.addresses;
create policy "delete own addresses" on public.addresses
  for delete to authenticated using (auth.uid() = user_id);

-- notifications: client menyisipkan notifikasi sistem (user_id null)
drop policy if exists "insert notifications" on public.notifications;
create policy "insert notifications" on public.notifications
  for insert to anon, authenticated with check (true);

-- reviews: hanya user login, sebagai dirinya sendiri
drop policy if exists "insert own reviews" on public.reviews;
create policy "insert own reviews" on public.reviews
  for insert to authenticated with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 2b. Auto-provision public.users dari auth.users
-- ---------------------------------------------------------------------
-- User login tersimpan di auth.users, sedangkan FK (user_identity,
-- bookings, addresses, reviews) menunjuk ke public.users. Tanpa baris
-- yang cocok, insert akan gagal FK. Trigger ini menyalin user baru ke
-- public.users; backfill mengisi user yang sudah ada.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, last_sign_in_at, created_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.last_sign_in_at,
    now()
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

-- Bungkus drop+create trigger agar kegagalan (mis. role bukan pemilik
-- auth.users) TIDAK membatalkan GRANT, policy, & backfill penting lain.
do $$
begin
  drop trigger if exists on_auth_user_created on auth.users;
  create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
exception when others then
  raise notice 'Lewati trigger auth.users (butuh hak pemilik): %', sqlerrm;
end;
$$;

insert into public.users (id, email, full_name, last_sign_in_at, created_at)
select
  id,
  email,
  coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  last_sign_in_at,
  created_at
from auth.users
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 3. Storage bucket untuk foto identitas
-- ---------------------------------------------------------------------
-- Kode memakai getPublicUrl(), jadi bucket dibuat public agar URL bisa
-- diakses. CATATAN KEAMANAN: foto ID bersifat sensitif; untuk produksi
-- sebaiknya bucket privat + signed URL (butuh sedikit perubahan kode).
insert into storage.buckets (id, name, public)
values ('id-documents', 'id-documents', true)
on conflict (id) do nothing;

-- Upload: hanya user login, ke folder miliknya sendiri (path: <uid>/<file>)
drop policy if exists "id-docs upload own" on storage.objects;
create policy "id-docs upload own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'id-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Update/replace file di folder sendiri
drop policy if exists "id-docs update own" on storage.objects;
create policy "id-docs update own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'id-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Baca: publik (bucket public); dibatasi ke bucket ini saja
drop policy if exists "id-docs read" on storage.objects;
create policy "id-docs read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'id-documents');
