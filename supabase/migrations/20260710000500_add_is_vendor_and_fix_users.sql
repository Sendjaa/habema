-- =====================================================================
-- Habema — Tambah is_vendor & perbaiki RLS users
-- =====================================================================
-- 1. Menambahkan kolom is_vendor ke tabel users
-- 2. Memastikan user login bisa membaca/membuat record users sendiri
-- 3. Trigger otomatis: ketika user login pertama kali, buat record users
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Kolom is_vendor
-- ---------------------------------------------------------------------
alter table public.users add column if not exists is_vendor boolean not null default false;

-- ---------------------------------------------------------------------
-- 2. Policy: user bisa baca record users sendiri
-- ---------------------------------------------------------------------
drop policy if exists "read own user" on public.users;
create policy "read own user" on public.users
  for select to authenticated using (auth.uid() = id);

-- Policy: user bisa insert record users sendiri (untuk trigger)
drop policy if exists "insert own user" on public.users;
create policy "insert own user" on public.users
  for insert to authenticated with check (auth.uid() = id);

-- Policy: user bisa update record users sendiri
drop policy if exists "update own user" on public.users;
create policy "update own user" on public.users
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- ---------------------------------------------------------------------
-- 3. Trigger: insert users record saat user login pertama kali
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, email, full_name, created_at, updated_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    now(),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Hapus trigger lama jika ada, lalu buat ulang
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
