-- Minimal bundles insert script - only use guaranteed existing columns
-- Based on errors, we know: bundle_price exists, slug/category don't exist

-- First, show the actual table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'bundles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Insert with only the columns we know exist
INSERT INTO public.bundles (id, name, bundle_price, description, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Open Trip Sunrise', 195000, 'Saksikan matahari terbit dari puncak yang menakjubkan bersama rombongan seru. Keberangkatan setiap akhir pekan.', NOW(), NOW()),
  
  (gen_random_uuid(), 'Open Trip Tracking & Hutan', 225000, 'Jelajahi jalur tracking ke puncak gunung atau lebatnya hutan bersama tim Habema. Cocok untuk solo traveler.', NOW(), NOW()),
  
  (gen_random_uuid(), 'Open Trip Explorer Wisata', 275000, 'Eksplorasi wisata daerah terpilih bersama komunitas satu visi. Perjalanan 3 hari 2 malam penuh kenangan.', NOW(), NOW()),

  (gen_random_uuid(), 'Paket Camping Keluarga', 700000, 'Paket sewa alat lengkap untuk keluarga besar. Kami urus semua perlengkapan, kamu fokus menikmati alam.', NOW(), NOW()),
  
  (gen_random_uuid(), 'Paket Camping Komunitas', 600000, 'Ideal untuk kelompok kecil hingga menengah. Nikmati suasana berkemah dengan semua alat siap pakai.', NOW(), NOW()),

  (gen_random_uuid(), 'Private Camp Eksklusif', 0, 'Area camping privat untuk organisasi, komunitas, sekolah, atau kampus. Setup eksklusif dengan nuansa alami. Harga custom - hubungi kami.', NOW(), NOW()),

  (gen_random_uuid(), 'Campervan Akhir Pekan', 1200000, '3 hari 2 malam petualangan seru dengan campervan. Kebebasan menjelajah daerah wisata pilihan Anda.', NOW(), NOW()),
  
  (gen_random_uuid(), 'Campervan Explorer Wisata', 0, 'Jelajahi wisata daerah dan tracking ke puncak gunung atau hutan dengan campervan yang fully equipped. Harga custom - hubungi kami.', NOW(), NOW());

-- Verify the insertion with only existing columns
SELECT 
  id,
  name,
  bundle_price,
  description,
  created_at
FROM public.bundles 
ORDER BY created_at DESC;

SELECT 'Bundles inserted successfully with minimal columns!' as status;
