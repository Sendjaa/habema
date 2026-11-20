-- OpenTrip Gallery Storage Bucket
-- Dibuat: 2026-11-22
-- Bucket public untuk menyimpan gambar galeri lapangan yang diupload dari admin.

insert into storage.buckets (id, name, public)
values ('opentrip-gallery', 'opentrip-gallery', true)
on conflict (id) do nothing;

-- Baca: publik (bucket public)
drop policy if exists "opentrip-gallery read" on storage.objects;
create policy "opentrip-gallery read" on storage.objects
  for select
  using (
    bucket_id = 'opentrip-gallery'
  );

-- Upload: hanya user login (admin)
drop policy if exists "opentrip-gallery upload" on storage.objects;
create policy "opentrip-gallery upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'opentrip-gallery'
  );

-- Update/replace: hanya user login (admin)
drop policy if exists "opentrip-gallery update" on storage.objects;
create policy "opentrip-gallery update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'opentrip-gallery'
  );

-- Delete: hanya user login (admin)
drop policy if exists "opentrip-gallery delete" on storage.objects;
create policy "opentrip-gallery delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'opentrip-gallery'
  );