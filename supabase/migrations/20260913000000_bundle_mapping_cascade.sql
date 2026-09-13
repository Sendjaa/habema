-- =====================================================================
-- Habema — Hapus bundle tidak lagi ditolak bundle_id_mapping (FK CASCADE)
-- IDEMPOTEN: aman dijalankan ulang.
--
-- Latar: DELETE /admin bundles gagal dengan
--   'update or delete on table "bundles" violates foreign key constraint
--    "bundle_id_mapping_uuid_id_fkey" on table "bundle_id_mapping"'
-- karena FK bundle_id_mapping.uuid_id -> bundles.id dibuat tanpa
-- ON DELETE CASCADE di beberapa database.
--
-- Perbaikan permanen: buat ulang FK dengan ON DELETE CASCADE.
-- (Kode API juga sudah menghapus baris mapping dulu, jadi migrasi ini
--  hanya pengaman untuk hapus via SQL/dashboard.)
-- booking_bundle_items SENGAJA tetap RESTRICT: paket yang sudah pernah
-- dibooking tidak boleh hilang dari riwayat — API menolak dengan pesan
-- ramah dan menyarankan nonaktifkan saja.
-- =====================================================================

do $$
begin
  if to_regclass('public.bundle_id_mapping') is not null then
    if exists (
      select 1 from pg_constraint where conname = 'bundle_id_mapping_uuid_id_fkey'
    ) then
      alter table public.bundle_id_mapping
        drop constraint bundle_id_mapping_uuid_id_fkey;
    end if;

    alter table public.bundle_id_mapping
      add constraint bundle_id_mapping_uuid_id_fkey
      foreign key (uuid_id) references public.bundles (id) on delete cascade;
  end if;
end;
$$;
