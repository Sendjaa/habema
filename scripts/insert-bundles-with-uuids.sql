-- Insert bundles data with proper UUIDs
-- This script creates the bundles with generated UUIDs

-- Generate proper UUIDs for bundles
INSERT INTO public.bundles (id, name, slug, description, price, price_old, unit, category, badge, image_url, is_active, sort_order, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Open Trip Sunrise', 'open-trip-sunrise', 'Saksikan matahari terbit dari puncak yang menakjubkan bersama rombongan seru. Keberangkatan setiap akhir pekan.', 195000, NULL, '/ orang', 'Open Trip', 'Terlaris', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80', true, 1, NOW(), NOW()),
  
  (gen_random_uuid(), 'Open Trip Tracking & Hutan', 'open-trip-tracking-hutan', 'Jelajahi jalur tracking ke puncak gunung atau lebatnya hutan bersama tim Habema. Cocok untuk solo traveler.', 225000, NULL, '/ orang', 'Open Trip', 'Petualangan', 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80', true, 2, NOW(), NOW()),
  
  (gen_random_uuid(), 'Open Trip Explorer Wisata', 'open-trip-explorer-wisata', 'Eksplorasi wisata daerah terpilih bersama komunitas satu visi. Perjalanan 3 hari 2 malam penuh kenangan.', 275000, NULL, '/ orang', 'Open Trip', NULL, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', true, 3, NOW(), NOW()),

  (gen_random_uuid(), 'Paket Camping Keluarga', 'paket-camping-keluarga', 'Paket sewa alat lengkap untuk keluarga besar. Kami urus semua perlengkapan, kamu fokus menikmati alam.', 700000, 850000, '/ 15 orang', 'Camping Keluarga', 'Rekomendasi', 'https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?w=800&q=80', true, 4, NOW(), NOW()),
  
  (gen_random_uuid(), 'Paket Camping Komunitas', 'paket-camping-komunitas', 'Ideal untuk kelompok kecil hingga menengah. Nikmati suasana berkemah dengan semua alat siap pakai.', 600000, NULL, '/ 10 orang', 'Camping Keluarga', NULL, 'https://images.unsplash.com/photo-1499363536502-87642509e31b?w=800&q=80', true, 5, NOW(), NOW()),

  (gen_random_uuid(), 'Private Camp Eksklusif', 'private-camp-eksklusif', 'Area camping privat untuk organisasi, komunitas, sekolah, atau kampus. Setup eksklusif dengan nuansa alami.', NULL, NULL, NULL, 'Private Camp', 'Komunitas / Sekolah', 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80', true, 6, NOW(), NOW()),

  (gen_random_uuid(), 'Campervan Akhir Pekan', 'campervan-akhir-pekan', '3 hari 2 malam petualangan seru dengan campervan. Kebebasan menjelajah daerah wisata pilihan Anda.', 1200000, NULL, '/ paket', 'Campervan', '10% Diskon – 5 Pertama', 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=800&q=80', true, 7, NOW(), NOW()),
  
  (gen_random_uuid(), 'Campervan Explorer Wisata', 'campervan-explorer-wisata', 'Jelajahi wisata daerah dan tracking ke puncak gunung atau hutan dengan campervan yang fully equipped.', NULL, NULL, NULL, 'Campervan', NULL, 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80', true, 8, NOW(), NOW())
RETURNING id, name, category;

-- Get the bundle IDs for creating bundle_items
WITH bundle_ids AS (
  SELECT id, name FROM public.bundles WHERE is_active = true ORDER BY sort_order
),
equipment_ids AS (
  -- Get some sample equipment IDs (you may need to adjust this based on your actual equipment table)
  SELECT id, name FROM public.equipment LIMIT 20
)
SELECT 'Bundles created successfully!' as status;

-- Create a temporary table to store the bundle-equipment relationships
-- This is a template - you'll need to adjust the equipment mappings based on your actual equipment table

-- Example for Open Trip Sunrise (assuming we have equipment with these names)
DO $$
DECLARE
  bundle_uuid UUID;
  equipment_uuid UUID;
BEGIN
  -- Get the bundle UUID for Open Trip Sunrise
  SELECT id INTO bundle_uuid FROM public.bundles WHERE name = 'Open Trip Sunrise' LIMIT 1;
  
  IF bundle_uuid IS NOT NULL THEN
    -- Add equipment items (you'll need to replace these with actual equipment UUIDs)
    -- This is just an example structure
    
    -- For Guide service
    INSERT INTO public.bundle_items (bundle_id, equipment_id, quantity)
    SELECT bundle_uuid, id, 1 FROM public.equipment WHERE name ILIKE '%guide%' LIMIT 1
    ON CONFLICT (bundle_id, equipment_id) DO NOTHING;
    
    -- For Tent
    INSERT INTO public.bundle_items (bundle_id, equipment_id, quantity)
    SELECT bundle_uuid, id, 1 FROM public.equipment WHERE name ILIKE '%tent%' LIMIT 1
    ON CONFLICT (bundle_id, equipment_id) DO NOTHING;
    
    -- For Sleeping bag
    INSERT INTO public.bundle_items (bundle_id, equipment_id, quantity)
    SELECT bundle_uuid, id, 1 FROM public.equipment WHERE name ILIKE '%sleeping%' LIMIT 1
    ON CONFLICT (bundle_id, equipment_id) DO NOTHING;
  END IF;
END $$;

-- Verify the bundles were created
SELECT 
  id,
  name,
  category,
  price,
  unit,
  badge,
  is_active,
  sort_order
FROM public.bundles 
WHERE is_active = true 
ORDER BY sort_order;

SELECT 'Bundle creation completed!' as status;
