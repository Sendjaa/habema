-- ============================================================
-- Seed data UJI untuk database lokal (habema_local).
--
-- JANGAN dijalankan terhadap database production. Isinya dua hal yang
-- dibutuhkan homepage v2 supaya section-nya tampil, bukan data bisnis:
--
--   1. equipment.activities — slug dari lib/activities.ts, dipetakan dari
--      nama alat. Katalog lokal punya kolom category kosong, jadi pemetaan
--      ini membaca nama alat, bukan kategori.
--   2. client_organizations — baris uji dengan consent_note yang menegaskan
--      statusnya. Namesya sengaja generik; jangan disalin ke production.
--
-- IDEMPOTEN: aman dijalankan ulang.
--
--     psql "$POSTGRES_URL" -f scripts/local-dev-seed.sql
-- ============================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Kegiatan per alat
-- ---------------------------------------------------------------------
-- WHEN ditest dari atas; yang pertama cocok menang. Nama alat dicocokkan
-- longgar (regex) supaya seed ini tetap jalan kalau ada alat baru.
update public.equipment e
set activities = case
  -- tenda
  when e.name ~* '^tenda (hanlu|mandala)'      then array['camping-keluarga','private-camp','open-trip']
  when e.name ~* '^tenda compas 4'             then array['camping-keluarga','private-camp','open-trip']
  when e.name ~* '^tenda (hy|lwy|wildsheel)'   then array['camping-keluarga','private-camp']
  when e.name ~* '^tenda alltrek'              then array['camping-keluarga','pendakian','open-trip']
  when e.name ~* '^tenda compas 2'             then array['camping-keluarga','pendakian']
  when e.name ~* '^tenda toilet'               then array['private-camp','camping-keluarga','open-trip']

  -- carrier & tas
  when e.name ~* '^carrier (eiger|karimor)'    then array['pendakian','open-trip']
  when e.name ~* '^carrier'                    then array['pendakian','open-trip','campervan']
  when e.name ~* '^tas daypack'                then array['trail-running','pendakian','open-trip']
  when e.name ~* '^hydropack'                  then array['trail-running']
  when e.name ~* '^cover bag'                  then array['pendakian','campervan']

  -- tidur
  when e.name ~* '^sleeping bag'               then array['pendakian','camping-keluarga','open-trip']
  when e.name ~* '^(matras|martas)'            then array['pendakian','camping-keluarga','trail-running']
  when e.name ~* '^hammock'                    then array['camping-keluarga','private-camp','campervan']
  when e.name ~* '^tikar'                      then array['camping-keluarga','private-camp','campervan']

  -- masak
  when e.name ~* '^kompor portable'            then array['camping-keluarga','private-camp','campervan']
  when e.name ~* '^(kompor|camping stove|cooking set|nesting|gas)'
                                               then array['camping-keluarga','private-camp','open-trip']
  when e.name ~* '^paket bbq'                  then array['camping-keluarga','private-camp']

  -- lampu
  when e.name ~* '^headlamp'                   then array['pendakian','trail-running']
  when e.name ~* '^senter'                     then array['camping-keluarga','private-camp','campervan']
  when e.name ~* '^(lampu camping|lampu remang)'
                                               then array['camping-keluarga','private-camp']

  -- pakaian & alas kaki
  when e.name ~* '^(ponco|jas hujan)'          then array['pendakian','trail-running','open-trip']
  when e.name ~* '^jacket'                     then array['pendakian','trail-running','campervan']
  when e.name ~* '^sepatu'                     then array['pendakian','trail-running']
  when e.name ~* '^(celana|sarung tangan)'     then array['pendakian','trail-running']
  when e.name ~* '^trekking pole'              then array['pendakian','trail-running']

  -- meja/kursi/penunjang
  when e.name ~* '^(meja|kompan)'              then array['camping-keluarga','private-camp','campervan']
  when e.name ~* '^tiang fly sheet'            then array['camping-keluarga','private-camp','campervan']

  -- elektronik & lainnya
  when e.name ~* 'power bank'                  then array['campervan','pendakian','trail-running']
  when e.name ~* '^(handy ?talkie)'            then array['private-camp','open-trip']
  when e.name ~* '^tripod'                     then array['campervan','camping-keluarga','open-trip']

  else e.activities
end
where e.name ~* '^(tenda|carrier|tas daypack|hydropack|cover bag|sleeping bag|matras|martas|hammock|tikar|kompor|camping stove|cooking set|nesting|gas|paket bbq|headlamp|senter|lampu|ponco|jas hujan|jacket|sepatu|celana|sarung tangan|trekking pole|meja|kompan|tiang|handy|talkie|tripod)'
   or e.name ~* 'power bank';

-- ---------------------------------------------------------------------
-- 1b. Promo aktif
-- ---------------------------------------------------------------------
-- Harga promo di halaman /bundles dan detail produk, turunan langsung dari
-- price_per_night (bukan angka acak). Section Promo di homepage TIDAK memakai
-- baris ini lagi — isinya banner dari tabel promo_banners (lihat 1c).
update public.equipment
set is_promo = true,
    discount_percentage = 20,
    promo_price_per_night = round(price_per_night * 0.8),
    promo_start_date = date_trunc('day', now()) - interval '1 day',
    promo_end_date = date_trunc('day', now()) + interval '30 days'
where name in ('Tenda Hanlu 10-12 Orang', 'Carrier Eiger 80L', 'Sleeping Bag Eiger Mummy 250');

-- ---------------------------------------------------------------------
-- 1c. Banner promo homepage
-- ---------------------------------------------------------------------
-- Satu baris uji memakai aset promo yang sudah ada di repo. Dijaga
-- `not exists` supaya banner hasil kurasi admin tidak tertimpa saat seed
-- dijalankan ulang.
insert into public.promo_banners (title, image_url, link_url, display_order, is_active)
select 'Promo Habema', '/images/discount-banner.png', '/bundles', 1, true
where not exists (select 1 from public.promo_banners);

-- ---------------------------------------------------------------------
-- 2. Instansi untuk logo cloud
-- ---------------------------------------------------------------------
-- is_active diset true HANYA di database lokal supaya section-nya teruji.
-- consent_note diisi penanda data uji; di production baris baru harus tetap
-- false sampai izin tertulis dari instansi dicatat di kolom itu.
insert into public.client_organizations
  (name, logo_url, sector, documentation_slug, display_order, is_active, consent_note)
values
  ('Kampus Uji Lokal',        null, 'Pendidikan',  'kampus-uji-lokal', 1, true,
   'DATA UJI scripts/local-dev-seed.sql — bukan instansi nyata, jangan disalin ke production'),
  ('SMA Bina Nusantara',      null, 'Pendidikan',  null,               2, true,
   'DATA UJI scripts/local-dev-seed.sql — bukan instansi nyata, jangan disalin ke production'),
  ('Komunitas Trail Sunda',   null, 'Komunitas',   'komunitas-trail-sunda', 3, true,
   'DATA UJI scripts/local-dev-seed.sql — bukan instansi nyata, jangan disalin ke production'),
  ('PT Karya Mandiri',        null, 'Korporat',    null,               4, true,
   'DATA UJI scripts/local-dev-seed.sql — bukan instansi nyata, jangan disalin ke production'),
  ('Base Camp Cendana',       null, 'Komunitas',   null,               5, true,
   'DATA UJI scripts/local-dev-seed.sql — bukan instansi nyata, jangan disalin ke production'),
  ('Yayasan Rimba Lestari',   null, 'Yayasan',     null,               6, false,
   'Sengaja is_active=false: menguji logo cloud menyembunyikan baris yang belum izin')
on conflict (lower(name)) do nothing;

commit;

-- Ringkasan hasil seed.
select 'activities terisi' as checks, count(*)::text
from public.equipment where array_length(activities, 1) > 0
union all
select 'promo aktif', count(*)::text
from public.equipment
where is_promo and (promo_end_date is null or promo_end_date > now())
union all
select 'instansi tampil', count(*)::text
from public.client_organizations where is_active
union all
select 'instansi punya halaman dokumentasi', count(*)::text
from public.client_organizations where is_active and documentation_slug is not null;
