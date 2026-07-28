-- =====================================================================
-- Habema — Storage bucket untuk gambar equipment + RLS insert/update
-- =====================================================================
-- Membuat bucket `equipment` untuk menyimpan gambar produk dan
-- menambahkan policy INSERT/UPDATE/DELETE untuk admin pada tabel equipment.

-- ---------------------------------------------------------------------
-- 1. Storage bucket untuk gambar equipment (public)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('equipment', 'equipment', true)
on conflict (id) do nothing;

-- Upload: siapa saja yang bisa insert (public bucket)
drop policy if exists "equipment upload" on storage.objects;
create policy "equipment upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'equipment');

-- Update file
drop policy if exists "equipment update" on storage.objects;
create policy "equipment update" on storage.objects
  for update to authenticated
  using (bucket_id = 'equipment');

-- Delete file
drop policy if exists "equipment delete" on storage.objects;
create policy "equipment delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'equipment');

-- Baca: publik (bucket public)
drop policy if exists "equipment read" on storage.objects;
create policy "equipment read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'equipment');

-- ---------------------------------------------------------------------
-- 2. Policy INSERT/UPDATE/DELETE untuk tabel equipment
-- ---------------------------------------------------------------------
drop policy if exists "admin insert equipment" on public.equipment;
create policy "admin insert equipment" on public.equipment
  for insert to authenticated with check (true);

drop policy if exists "admin update equipment" on public.equipment;
create policy "admin update equipment" on public.equipment
  for update to authenticated using (true) with check (true);

drop policy if exists "admin delete equipment" on public.equipment;
create policy "admin delete equipment" on public.equipment
  for delete to authenticated using (true);
