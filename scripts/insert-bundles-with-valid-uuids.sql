-- Insert bundles data with valid UUIDs that match frontend IDs concept
-- Since the table uses UUID type, we need to generate valid UUIDs

-- Create a mapping table to associate string IDs with UUIDs
-- This will help maintain frontend compatibility

INSERT INTO public.bundles (id, name, description, target_audience, original_price, bundle_price, discount_percentage, image_url, is_active, created_at, includes, excludes)
VALUES 
  -- Open Trip Sunrise - Using a deterministic UUID based on the string ID
  ('550e8400-e29b-41d4-a716-446655440001', 
   'Open Trip Sunrise', 
   'Saksikan matahari terbit dari puncak yang menakjubkan bersama rombongan seru. Keberangkatan setiap akhir pekan.',
   'Open Trip',
   NULL,
   195000,
   NULL,
   'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
   true,
   NOW(),
   '["Guide berpengalaman", "Tenda & sleeping bag", "Sarapan ringan", "Dokumentasi foto"]'::jsonb,
   '["Transportasi pribadi", "Makan malam"]'::jsonb
  ),
  
  -- Open Trip Tracking & Hutan
  ('550e8400-e29b-41d4-a716-446655440002', 
   'Open Trip Tracking & Hutan', 
   'Jelajahi jalur tracking ke puncak gunung atau lebatnya hutan bersama tim Habema. Cocok untuk solo traveler.',
   'Open Trip',
   NULL,
   225000,
   NULL,
   'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80',
   true,
   NOW(),
   '["Guide tracking profesional", "Alat keselamatan", "Peta jalur", "Snack energi"]'::jsonb,
   '["Tiket masuk kawasan", "Transportasi"]'::jsonb
  ),
  
  -- Open Trip Explorer Wisata
  ('550e8400-e29b-41d4-a716-446655440003', 
   'Open Trip Explorer Wisata', 
   'Eksplorasi wisata daerah terpilih bersama komunitas satu visi. Perjalanan 3 hari 2 malam penuh kenangan.',
   'Open Trip',
   NULL,
   275000,
   NULL,
   'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
   true,
   NOW(),
   '["3 hari 2 malam", "Tenda & matras", "Guide wisata", "Dokumentasi trip"]'::jsonb,
   '["Tiket masuk objek wisata", "Makan"]'::jsonb
  ),

  -- Paket Camping Keluarga
  ('550e8400-e29b-41d4-a716-446655440004', 
   'Paket Camping Keluarga', 
   'Paket sewa alat lengkap untuk keluarga besar. Kami urus semua perlengkapan, kamu fokus menikmati alam.',
   'Camping Keluarga',
   850000,
   700000,
   17.65,
   'https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?w=800&q=80',
   true,
   NOW(),
   '["5 Tenda kap 3-4 orang", "15 Sleeping bag", "15 Matras", "5 Lampu tenda", "Flysheet 4x6 + tiang", "Lampu remang & luar", "Bongkar pasang tenda", "Antar jemput lokasi"]'::jsonb,
   '["Tiket masuk kawasan", "Peralatan masak", "Ongkir jarak jauh"]'::jsonb
  ),
  
  -- Paket Camping Komunitas
  ('550e8400-e29b-41d4-a716-446655440005', 
   'Paket Camping Komunitas', 
   'Ideal untuk kelompok kecil hingga menengah. Nikmati suasana berkemah dengan semua alat siap pakai.',
   'Camping Keluarga',
   NULL,
   600000,
   NULL,
   'https://images.unsplash.com/photo-1499363536502-87642509e31b?w=800&q=80',
   true,
   NOW(),
   '["3 Tenda kap 3-4 orang", "10 Sleeping bag", "10 Matras", "Lampu tenda & luar", "Bongkar pasang tenda"]'::jsonb,
   '["Tiket masuk kawasan", "Transportasi"]'::jsonb
  ),

  -- Private Camp Eksklusif
  ('550e8400-e29b-41d4-a716-446655440006', 
   'Private Camp Eksklusif', 
   'Area camping privat untuk organisasi, komunitas, sekolah, atau kampus. Setup eksklusif dengan nuansa alami.',
   'Private Camp',
   NULL,
   0,
   NULL,
   'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80',
   true,
   NOW(),
   '["Area camp privat", "Dekorasi & bendera warna-warni", "Tenda sesuai jumlah peserta", "Pendampingan tim Habema", "Fleksibel lokasi & durasi"]'::jsonb,
   '["Tiket masuk kawasan", "Konsumsi peserta"]'::jsonb
  ),

  -- Campervan Akhir Pekan
  ('550e8400-e29b-41d4-a716-446655440007', 
   'Campervan Akhir Pekan', 
   '3 hari 2 malam petualangan seru dengan campervan. Kebebasan menjelajah daerah wisata pilihan Anda.',
   'Campervan',
   NULL,
   1200000,
   NULL,
   'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=800&q=80',
   true,
   NOW(),
   '["Campervan nyaman", "Paket Matahari Terbit (2H1M)", "Paket Akhir Pekan (3H2M)", "Supir berpengalaman"]'::jsonb,
   '["BBM tambahan", "Tiket masuk wisata"]'::jsonb
  ),
  
  -- Campervan Explorer Wisata
  ('550e8400-e29b-41d4-a716-446655440008', 
   'Campervan Explorer Wisata', 
   'Jelajahi wisata daerah dan tracking ke puncak gunung atau hutan dengan campervan yang fully equipped.',
   'Campervan',
   NULL,
   0,
   NULL,
   'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80',
   true,
   NOW(),
   '["Paket Explorer Wisata Daerah", "Paket Petualangan Tracking", "Akomodasi campervan", "Guide wisata lokal"]'::jsonb,
   '[]'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  target_audience = EXCLUDED.target_audience,
  original_price = EXCLUDED.original_price,
  bundle_price = EXCLUDED.bundle_price,
  discount_percentage = EXCLUDED.discount_percentage,
  image_url = EXCLUDED.image_url,
  is_active = EXCLUDED.is_active,
  includes = EXCLUDED.includes,
  excludes = EXCLUDED.excludes;

-- Create a reference table for ID mapping (optional, for frontend compatibility)
-- This table can help map between string IDs and UUIDs
CREATE TABLE IF NOT EXISTS public.bundle_id_mapping (
  string_id TEXT PRIMARY KEY,
  uuid_id UUID NOT NULL REFERENCES public.bundles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the mappings
INSERT INTO public.bundle_id_mapping (string_id, uuid_id) VALUES
  ('open-trip-sunrise', '550e8400-e29b-41d4-a716-446655440001'),
  ('open-trip-tracking', '550e8400-e29b-41d4-a716-446655440002'),
  ('open-trip-explorer', '550e8400-e29b-41d4-a716-446655440003'),
  ('camping-keluarga', '550e8400-e29b-41d4-a716-446655440004'),
  ('camping-komunitas', '550e8400-e29b-41d4-a716-446655440005'),
  ('private-camp', '550e8400-e29b-41d4-a716-446655440006'),
  ('campervan-weekend', '550e8400-e29b-41d4-a716-446655440007'),
  ('campervan-explorer', '550e8400-e29b-41d4-a716-446655440008')
ON CONFLICT (string_id) DO UPDATE SET
  uuid_id = EXCLUDED.uuid_id;

-- Verify the insertion
SELECT 
  b.id,
  b.name,
  b.target_audience as category,
  b.bundle_price,
  b.original_price,
  b.discount_percentage,
  b.is_active,
  b.created_at,
  m.string_id
FROM public.bundles b
LEFT JOIN public.bundle_id_mapping m ON b.id = m.uuid_id
ORDER BY 
  CASE b.target_audience
    WHEN 'Open Trip' THEN 1
    WHEN 'Camping Keluarga' THEN 2
    WHEN 'Private Camp' THEN 3
    WHEN 'Campervan' THEN 4
    ELSE 5
  END,
  b.created_at;

SELECT 'Bundles inserted successfully with valid UUIDs!' as status;
