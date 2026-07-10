-- =====================================================================
-- Habema — Backfill harga equipment
-- =====================================================================
-- Data harga lama tersimpan di price_per_night. Kolom price_per_day
-- (dipakai halaman admin) baru ditambahkan dengan default 0.
-- Salin nilainya agar admin & katalog konsisten.
-- Hanya menyentuh baris yang price_per_day masih 0 / null supaya
-- tidak menimpa harga yang mungkin sudah diperbaiki manual.
-- =====================================================================

update public.equipment
set price_per_day = price_per_night
where coalesce(price_per_day, 0) = 0
  and coalesce(price_per_night, 0) > 0;
