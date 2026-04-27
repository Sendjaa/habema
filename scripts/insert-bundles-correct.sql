-- Insert bundles data based on actual table structure
-- Table columns: id, name, description, target_audience, original_price, bundle_price, discount_percentage, image_url, is_active, created_at, includes, excludes

INSERT INTO public.bundles (id, name, description, target_audience, original_price, bundle_price, discount_percentage, image_url, is_active, created_at, includes, excludes)
VALUES 
  -- Open Trip Sunrise
  (gen_random_uuid(), 
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
  (gen_random_uuid(), 
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
  (gen_random_uuid(), 
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
  (gen_random_uuid(), 
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
  (gen_random_uuid(), 
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
  (gen_random_uuid(), 
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
  (gen_random_uuid(), 
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
  (gen_random_uuid(), 
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
  );

-- Verify the insertion
SELECT 
  id,
  name,
  target_audience,
  bundle_price,
  original_price,
  discount_percentage,
  is_active,
  created_at
FROM public.bundles 
ORDER BY created_at DESC;

-- Show includes/excludes for verification
SELECT 
  name,
  includes,
  excludes
FROM public.bundles 
ORDER BY created_at DESC;

SELECT 'Bundles inserted successfully with complete data!' as status;
