-- =====================================================================
-- Habema — Multi-Cabang Admin System
-- IDEMPOTEN: aman dijalankan ulang.
--
-- 1. users.role           : 'super_admin' | 'branch_admin'
-- 2. users.branch_id      : FK ke branches.id (null untuk super_admin)
-- 3. Admin baru default: super_admin, tanpa cabang (akses semua)
-- 4. Branch admin: hanya lihat/edit rental cabangnya sendiri
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tambah kolom role dan branch_id ke users
-- ---------------------------------------------------------------------
alter table public.users
  add column if not exists role text not null default 'customer';

alter table public.users
  add column if not exists branch_id uuid
  references public.branches(id) on delete set null;

comment on column public.users.role is
  'customer | super_admin | branch_admin';
comment on column public.users.branch_id is
  'Untuk branch_admin: cabang yang dikelola. Null untuk customer/super_admin.';

-- ---------------------------------------------------------------------
-- 2. Constraint: hanya customer, super_admin, atau branch_admin
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'users_role_check'
  ) then
    alter table public.users
      add constraint users_role_check
      check (role in ('customer', 'super_admin', 'branch_admin'));
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 3. Branch admin harus punya branch_id
-- ---------------------------------------------------------------------
create index if not exists users_role_idx on public.users (role);
create index if not exists users_branch_id_idx on public.users (branch_id);

-- ---------------------------------------------------------------------
-- 4. Migrasi data lama: is_vendor=true → super_admin (jika belum ada role)
-- ---------------------------------------------------------------------
update public.users
set role = 'super_admin'
where is_vendor = true and role = 'customer';

-- ---------------------------------------------------------------------
-- 5. RLS: semua role bisa baca tabel users sendiri
-- ---------------------------------------------------------------------
alter table public.users enable row level security;

-- Policy: admin (super_admin / branch_admin) bisa lihat semua users
create policy "Admins can view all users"
  on public.users for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('super_admin', 'branch_admin')
    )
  );

-- Policy: user bisa lihat data sendiri
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

-- ---------------------------------------------------------------------
-- 6. Function: cek apakah user adalah admin
-- ---------------------------------------------------------------------
create or replace function is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role in ('super_admin', 'branch_admin')
  );
$$;

-- ---------------------------------------------------------------------
-- 7. Function: cek apakah user adalah super_admin
-- ---------------------------------------------------------------------
create or replace function is_super_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'super_admin'
  );
$$;

-- ---------------------------------------------------------------------
-- 8. Function: ambil branch_id user yang login
-- ---------------------------------------------------------------------
create or replace function get_user_branch_id()
returns uuid
language sql
stable
as $$
  select branch_id from public.users where id = auth.uid();
$$;