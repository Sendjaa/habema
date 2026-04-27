-- Insert bundles data from the bundles page
-- This script creates the bundles and their relationships with equipment

-- First, let's check if the tables exist
SELECT 'Checking tables...' as status;

-- Insert Open Trip packages
INSERT INTO public.bundles (id, name, slug, description, price, price_old, unit, category, badge, image_url, is_active, sort_order, created_at, updated_at)
VALUES 
  ('open-trip-sunrise-uuid', 'Open Trip Sunrise', 'open-trip-sunrise', 'Saksikan matahari terbit dari puncak yang menakjubkan bersama rombongan seru. Keberangkatan setiap akhir pekan.', 195000, NULL, '/ orang', 'Open Trip', 'Terlaris', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80', true, 1, NOW(), NOW()),
  
  ('open-trip-tracking-uuid', 'Open Trip Tracking & Hutan', 'open-trip-tracking-hutan', 'Jelajahi jalur tracking ke puncak gunung atau lebatnya hutan bersama tim Habema. Cocok untuk solo traveler.', 225000, NULL, '/ orang', 'Open Trip', 'Petualangan', 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80', true, 2, NOW(), NOW()),
  
  ('open-trip-explorer-uuid', 'Open Trip Explorer Wisata', 'open-trip-explorer-wisata', 'Eksplorasi wisata daerah terpilih bersama komunitas satu visi. Perjalanan 3 hari 2 malam penuh kenangan.', 275000, NULL, '/ orang', 'Open Trip', NULL, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', true, 3, NOW(), NOW()),

-- Insert Camping Keluarga packages
  ('camping-keluarga-uuid', 'Paket Camping Keluarga', 'paket-camping-keluarga', 'Paket sewa alat lengkap untuk keluarga besar. Kami urus semua perlengkapan, kamu fokus menikmati alam.', 700000, 850000, '/ 15 orang', 'Camping Keluarga', 'Rekomendasi', 'https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?w=800&q=80', true, 4, NOW(), NOW()),
  
  ('camping-komunitas-uuid', 'Paket Camping Komunitas', 'paket-camping-komunitas', 'Ideal untuk kelompok kecil hingga menengah. Nikmati suasana berkemah dengan semua alat siap pakai.', 600000, NULL, '/ 10 orang', 'Camping Keluarga', NULL, 'https://images.unsplash.com/photo-1499363536502-87642509e31b?w=800&q=80', true, 5, NOW(), NOW()),

-- Insert Private Camp packages
  ('private-camp-uuid', 'Private Camp Eksklusif', 'private-camp-eksklusif', 'Area camping privat untuk organisasi, komunitas, sekolah, atau kampus. Setup eksklusif dengan nuansa alami.', NULL, NULL, NULL, 'Private Camp', 'Komunitas / Sekolah', 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80', true, 6, NOW(), NOW()),

-- Insert Campervan packages
  ('campervan-weekend-uuid', 'Campervan Akhir Pekan', 'campervan-akhir-pekan', '3 hari 2 malam petualangan seru dengan campervan. Kebebasan menjelajah daerah wisata pilihan Anda.', 1200000, NULL, '/ paket', 'Campervan', '10% Diskon – 5 Pertama', 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=800&q=80', true, 7, NOW(), NOW()),
  
  ('campervan-explorer-uuid', 'Campervan Explorer Wisata', 'campervan-explorer-wisata', 'Jelajahi wisata daerah dan tracking ke puncak gunung atau hutan dengan campervan yang fully equipped.', NULL, NULL, NULL, 'Campervan', NULL, 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80', true, 8, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  price_old = EXCLUDED.price_old,
  unit = EXCLUDED.unit,
  category = EXCLUDED.category,
  badge = EXCLUDED.badge,
  image_url = EXCLUDED.image_url,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

SELECT 'Bundles inserted successfully!' as status;

-- Now create bundle_items relationships
-- Note: You'll need to replace these with actual equipment UUIDs from your equipment table

-- For Open Trip Sunrise (Guide berpengalaman, Tenda & sleeping bag, Sarapan ringan, Dokumentasi foto)
INSERT INTO public.bundle_items (bundle_id, equipment_id, quantity)
SELECT 
  'open-trip-sunrise-uuid',
  'EQUIPMENT_GUIDE_UUID', -- Replace with actual equipment UUID
  1
ON CONFLICT (bundle_id, equipment_id) DO NOTHING;

INSERT INTO public.bundle_items (bundle_id, equipment_id, quantity)
SELECT 
  'open-trip-sunrise-uuid',
  'EQUIPMENT_TENTA_UUID', -- Replace with actual equipment UUID
  1
ON CONFLICT (bundle_id, equipment_id) DO NOTHING;

INSERT INTO public.bundle_items (bundle_id, equipment_id, quantity)
SELECT 
  'open-trip-sunrise-uuid',
  'EQUIPMENT_SLEEPING_BAG_UUID', -- Replace with actual equipment UUID
  1
ON CONFLICT (bundle_id, equipment_id) DO NOTHING;

INSERT INTO public.bundle_items (bundle_id, equipment_id, quantity)
SELECT 
  'open-trip-sunrise-uuid',
  'EQUIPMENT_BREAKFAST_UUID', -- Replace with actual equipment UUID
  1
ON CONFLICT (bundle_id, equipment_id) DO NOTHING;

INSERT INTO public.bundle_items (bundle_id, equipment_id, quantity)
SELECT 
  'open-trip-sunrise-uuid',
  'EQUIPMENT_CAMERA_UUID', -- Replace with actual equipment UUID
  1
ON CONFLICT (bundle_id, equipment_id) DO NOTHING;

-- For Open Trip Tracking & Hutan (Guide tracking profesional, Alat keselamatan, Peta jalur, Snack energi)
INSERT INTO public.bundle_items (bundle_id, equipment_id, quantity)
SELECT 
  'open-trip-tracking-uuid',
  'EQUIPMENT_TRACKING_GUIDE_UUID', -- Replace with actual equipment UUID
  1
ON CONFLICT (bundle_id, equipment_id) DO NOTHING;

INSERT INTO public.bundle_items (bundle_id, equipment_id, quantity)
SELECT 
  'open-trip-tracking-uuid',
  'EQUIPMENT_SAFETY_GEAR_UUID', -- Replace with actual equipment UUID
  1
ON CONFLICT (bundle_id, equipment_id) DO NOTHING;

INSERT INTO public.bundle_items (bundle_id, equipment_id, quantity)
SELECT 
  'open-trip-tracking-uuid',
  'EQUIPMENT_MAP_UUID', -- Replace with actual equipment UUID
  1
ON CONFLICT (bundle_id, equipment_id) DO NOTHING;

INSERT INTO public.bundle_items (bundle_id, equipment_id, quantity)
SELECT 
  'open-trip-tracking-uuid',
  'EQUIPMENT_SNACK_UUID', -- Replace with actual equipment UUID
  1
ON CONFLICT (bundle_id, equipment_id) DO NOTHING;

-- For Camping Keluarga (5 Tenda kap 3–4 orang, 15 Sleeping bag, 15 Matras, 5 Lampu tenda, Flysheet 4×6 + tiang, Lampu remang & luar, Bongkar pasang tenda, Antar jemput lokasi)
INSERT INTO public.bundle_items (bundle_id, equipment_id, quantity)
SELECT 
  'camping-keluarga-uuid',
  'EQUIPMENT_TENT_3_4_UUID', -- Replace with actual equipment UUID
  5
ON CONFLICT (bundle_id, equipment_id) DO NOTHING;

INSERT INTO public.bundle_items (bundle_id, equipment_id, quantity)
SELECT 
  'camping-keluarga-uuid',
  'EQUIPMENT_SLEEPING_BAG_FAMILY_UUID', -- Replace with actual equipment UUID
  15
ON CONFLICT (bundle_id, equipment_id) DO NOTHING;

INSERT INTO public.bundle_items (bundle_id, equipment_id, quantity)
SELECT 
  'camping-keluarga-uuid',
  'EQUIPMENT_MATRAS_UUID', -- Replace with actual equipment UUID
  15
ON CONFLICT (bundle_id, equipment_id) DO NOTHING;

INSERT INTO public.bundle_items (bundle_id, equipment_id, quantity)
SELECT 
  'camping-keluarga-uuid',
  'EQUIPMENT_LAMP_TENDA_UUID', -- Replace with actual equipment UUID
  5
ON CONFLICT (bundle_id, equipment_id) DO NOTHING;

INSERT INTO public.bundle_items (bundle_id, equipment_id, quantity)
SELECT 
  'camping-keluarga-uuid',
  'EQUIPMENT_FLYSHEET_UUID', -- Replace with actual equipment UUID
  1
ON CONFLICT (bundle_id, equipment_id) DO NOTHING;

INSERT INTO public.bundle_items (bundle_id, equipment_id, quantity)
SELECT 
  'camping-keluarga-uuid',
  'EQUIPMENT_LAMP_REMANG_UUID', -- Replace with actual equipment UUID
  2
ON CONFLICT (bundle_id, equipment_id) DO NOTHING;

INSERT INTO public.bundle_items (bundle_id, equipment_id, quantity)
SELECT 
  'camping-keluarga-uuid',
  'EQUIPMENT_LAMP_LUAR_UUID', -- Replace with actual equipment UUID
  1
ON CONFLICT (bundle_id, equipment_id) DO NOTHING;

SELECT 'Bundle items relationships created!' as status;

-- Verify the data was inserted
SELECT 
  b.name,
  b.category,
  b.price,
  b.unit,
  COUNT(bi.equipment_id) as equipment_count
FROM public.bundles b
LEFT JOIN public.bundle_items bi ON b.id = bi.bundle_id
WHERE b.is_active = true
GROUP BY b.id, b.name, b.category, b.price, b.unit
ORDER BY b.sort_order;

SELECT 'Script completed successfully!' as status;
