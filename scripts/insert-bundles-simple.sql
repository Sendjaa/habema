-- Simple bundles insert script - adjust columns based on actual table structure
-- First check what columns exist in the bundles table
SELECT 'Checking bundles table structure...' as status;

-- Check if bundles table exists and show its structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'bundles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Try a simple insert with basic columns that likely exist
-- Adjust this based on the actual column names from the query above

-- Basic insert attempt (modify columns as needed)
DO $$
BEGIN
    -- Try inserting with common column names
    BEGIN
        INSERT INTO public.bundles (id, name, description, price, category, is_active, created_at, updated_at)
        VALUES 
            (gen_random_uuid(), 'Open Trip Sunrise', 'Saksikan matahari terbit dari puncak yang menakjubkan bersama rombongan seru. Keberangkatan setiap akhir pekan.', 195000, 'Open Trip', true, NOW(), NOW()),
            (gen_random_uuid(), 'Open Trip Tracking & Hutan', 'Jelajahi jalur tracking ke puncak gunung atau lebatnya hutan bersama tim Habema. Cocok untuk solo traveler.', 225000, 'Open Trip', true, NOW(), NOW()),
            (gen_random_uuid(), 'Open Trip Explorer Wisata', 'Eksplorasi wisata daerah terpilih bersama komunitas satu visi. Perjalanan 3 hari 2 malam penuh kenangan.', 275000, 'Open Trip', true, NOW(), NOW()),
            (gen_random_uuid(), 'Paket Camping Keluarga', 'Paket sewa alat lengkap untuk keluarga besar. Kami urus semua perlengkapan, kamu fokus menikmati alam.', 700000, 'Camping Keluarga', true, NOW(), NOW()),
            (gen_random_uuid(), 'Paket Camping Komunitas', 'Ideal untuk kelompok kecil hingga menengah. Nikmati suasana berkemah dengan semua alat siap pakai.', 600000, 'Camping Keluarga', true, NOW(), NOW()),
            (gen_random_uuid(), 'Private Camp Eksklusif', 'Area camping privat untuk organisasi, komunitas, sekolah, atau kampus. Setup eksklusif dengan nuansa alami.', NULL, 'Private Camp', true, NOW(), NOW()),
            (gen_random_uuid(), 'Campervan Akhir Pekan', '3 hari 2 malam petualangan seru dengan campervan. Kebebasan menjelajah daerah wisata pilihan Anda.', 1200000, 'Campervan', true, NOW(), NOW()),
            (gen_random_uuid(), 'Campervan Explorer Wisata', 'Jelajahi wisata daerah dan tracking ke puncak gunung atau hutan dengan campervan yang fully equipped.', NULL, 'Campervan', true, NOW(), NOW());
        
        RAISE NOTICE 'Bundles inserted successfully with basic columns!';
    EXCEPTION 
        WHEN undefined_column THEN
            RAISE NOTICE 'Some columns do not exist. Checking table structure...';
            
            -- Try with minimal columns
            INSERT INTO public.bundles (id, name, created_at)
            VALUES 
                (gen_random_uuid(), 'Open Trip Sunrise', NOW()),
                (gen_random_uuid(), 'Open Trip Tracking & Hutan', NOW()),
                (gen_random_uuid(), 'Open Trip Explorer Wisata', NOW()),
                (gen_random_uuid(), 'Paket Camping Keluarga', NOW()),
                (gen_random_uuid(), 'Paket Camping Komunitas', NOW()),
                (gen_random_uuid(), 'Private Camp Eksklusif', NOW()),
                (gen_random_uuid(), 'Campervan Akhir Pekan', NOW()),
                (gen_random_uuid(), 'Campervan Explorer Wisata', NOW());
            
            RAISE NOTICE 'Bundles inserted with minimal columns!';
    END;
END $$;

-- Verify the insertion
SELECT id, name, COALESCE(price::text, 'Custom Price') as price, COALESCE(category, 'No Category') as category
FROM public.bundles 
ORDER BY created_at DESC 
LIMIT 8;

SELECT 'Bundle insertion completed!' as status;
