-- Policy "Admins can view all users" memakai subquery ke public.users di dalam
-- USING-nya sendiri. PostgreSQL mengevaluasi policy itu saat membaca users,
-- sehingga terjadi infinite recursion (SQLSTATE 42P17) untuk semua query
-- client (anon/authenticated) ke tabel users. Service role tidak terkena
-- karena melewati RLS.
--
-- Perbaikan: cek admin dipindah ke fungsi SECURITY DEFINER yang membaca users
-- sebagai owner tabel (melewati RLS), lalu policy memanggil fungsi itu.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role in ('super_admin', 'branch_admin')
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'super_admin'
  );
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.is_super_admin() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_super_admin() to authenticated;

drop policy if exists "Admins can view all users" on public.users;
create policy "Admins can view all users"
  on public.users for select
  to authenticated
  using (public.is_admin());
