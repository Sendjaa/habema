-- =====================================================================
-- Habema — GRANT service_role untuk seluruh tabel di schema public
-- =====================================================================
-- Dashboard admin & API routes memakai supabaseAdmin (service role key).
-- service_role punya BYPASSRLS tetapi tetap butuh privilege tabel;
-- migrasi sebelumnya hanya memberi GRANT ke anon & authenticated sehingga
-- muncul "permission denied for table users" (42501).
-- =====================================================================

grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Agar tabel baru yang dibuat nanti juga otomatis diberi akses service_role
alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public
  grant usage, select on sequences to service_role;
