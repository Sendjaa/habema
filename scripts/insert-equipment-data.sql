-- Insert additional equipment data for Habema Outdoor
-- This script adds more camping and outdoor equipment products

-- First, ensure we have equipment categories
INSERT INTO equipment_categories (name, description, icon_name, display_order) VALUES
('Tenda', 'Berbagai jenis tenda untuk camping', 'tent', 1),
('Sleeping Bag', 'Kantong tidur nyaman untuk berbagai suhu', 'bed', 2),
('Backpack', 'Ransel hiking dan travelling', 'backpack', 3),
('Cooking Set', 'Peralatan masak outdoor', 'cookware', 4),
('Lighting', 'Lampu dan penerangan camping', 'light', 5),
('Matras', 'Kasur portable untuk kenyamanan', 'bed', 6),
('Clothing', 'Pakaian outdoor dan perlengkapan', 'shirt', 7),
('Navigation', 'Alat navigasi dan GPS', 'compass', 8),
('Safety', 'Peralatan safety dan first aid', 'shield', 9),
('Accessories', 'Aksesoris camping pendukung', 'tool', 10)
ON CONFLICT (name) DO NOTHING;

-- Insert equipment products
INSERT INTO equipment (name, category_id, description, detailed_description, price_per_night, image_url, weight_kg, dimensions, capacity, material, weather_rating, rental_count, average_rating, is_active) 
SELECT 
  name,
  category_id,
  description,
  detailed_description,
  price_per_night,
  image_url,
  weight_kg,
  dimensions,
  capacity,
  material,
  weather_rating,
  rental_count,
  average_rating,
  is_active
FROM (
  VALUES 
  -- Tenda
  ('Tenda Dome 2-3 Orang', (SELECT id FROM equipment_categories WHERE name = 'Tenda'), 'Tenda dome ideal untuk 2-3 orang', 'Tenda dome dengan desain modern, mudah dipasang dan kokoh. Dilengkapi dengan flysheet waterproof dan ventilation system yang baik.', 75000, 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80', 3.2, '210x180x110 cm', '2-3 orang', 'Polyester 190T', '3 Musim', 45, 4.7, true),
  ('Tenda Family 4-6 Orang', (SELECT id FROM equipment_categories WHERE name = 'Tenda'), 'Tenda besar untuk keluarga', 'Tenda family dengan 2 kamar tidur dan ruang tengah. Sangat cocok untuk camping keluarga atau grup besar.', 120000, 'https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?w=800&q=80', 6.8, '300x240x200 cm', '4-6 orang', 'Polyester 210D', '3 Musim', 32, 4.8, true),
  ('Tenda Backpacking 1-2 Orang', (SELECT id FROM equipment_categories WHERE name = 'Tenda'), 'Tenda ultra-light untuk backpacking', 'Tenda ringan dan kompak untuk hiking dan backpacking. Mudah dibawa dan cepat dipasang.', 55000, 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80', 1.8, '180x120x95 cm', '1-2 orang', 'Nylon Ripstop', '3 Musim', 67, 4.6, true),
  
  -- Sleeping Bag
  ('Sleeping Bag Comfort 5°C', (SELECT id FROM equipment_categories WHERE name = 'Sleeping Bag'), 'Kantong tidur nyaman untuk suhu hangat', 'Sleeping bag dengan bahan halus dan nyaman. Cocok untuk camping di suhu hangat hingga sedang.', 35000, 'https://images.unsplash.com/photo-1499363536502-87642509e31b?w=800&q=80', 1.2, '190x75 cm', '1 orang', 'Polyester Fill', '5°C', 89, 4.5, true),
  ('Sleeping Bag Extreme -10°C', (SELECT id FROM equipment_categories WHERE name = 'Sleeping Bag'), 'Kantong tidur untuk suhu dingin ekstrem', 'Sleeping bag premium untuk cuaca dingin. Dengan isolasi berkualitas tinggi untuk menjaga kehangatan.', 55000, 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80', 2.1, '200x80 cm', '1 orang', 'Down Fill', '-10°C', 34, 4.8, true),
  
  -- Backpack
  ('Backpack Hiking 40L', (SELECT id FROM equipment_categories WHERE name = 'Backpack'), 'Ransel hiking kapasitas sedang', 'Backpack hiking dengan sistem suspensi nyaman dan banyak kompartemen. Ideal untuk hiking 2-3 hari.', 45000, 'https://images.unsplash.com/photo-1551698628-1d9c9e6c5b0e?w=800&q=80', 1.5, '65x35x25 cm', '40L', 'Nylon Cordura', 'All Weather', 78, 4.6, true),
  ('Backpack Travel 60L', (SELECT id FROM equipment_categories WHERE name = 'Backpack'), 'Ransel travelling kapasitas besar', 'Backpack dengan bukaan full front dan sistem kunci aman. Cocok untuk travelling jarak jauh.', 65000, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', 2.8, '75x40x30 cm', '60L', 'Polyester 600D', 'All Weather', 56, 4.7, true),
  
  -- Cooking Set
  ('Cooking Set Complete', (SELECT id FROM equipment_categories WHERE name = 'Cooking Set'), 'Set masak lengkap untuk outdoor', 'Cooking set lengkap dengan panci, wajan, piring, mangkok, dan peralatan makan. Cocok untuk 2-4 orang.', 40000, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80', 2.3, '20x15x12 cm', '2-4 orang', 'Aluminum', 'All Weather', 92, 4.4, true),
  ('Portable Camping Stove', (SELECT id FROM equipment_categories WHERE name = 'Cooking Set'), 'Kompor portable camping', 'Kompor gas portable dengan windshield. Efisien dan mudah digunakan di segala kondisi.', 25000, 'https://images.unsplash.com/photo-1528305340458-6d4ae989bbd1?w=800&q=80', 0.8, '15x10x8 cm', '1-2 orang', 'Stainless Steel', 'All Weather', 145, 4.5, true),
  
  -- Lighting
  ('Lampu Camping LED', (SELECT id FROM equipment_categories WHERE name = 'Lighting'), 'Lampu LED terang untuk camping', 'Lampu LED dengan brightness tinggi dan battery awet. Dilengkapi dengan hook untuk digantung.', 20000, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', 0.3, '8x8x12 cm', '1 unit', 'Plastic ABS', 'All Weather', 178, 4.3, true),
  ('Headlamp USB Rechargeable', (SELECT id FROM equipment_categories WHERE name = 'Lighting'), 'Headlamp rechargeable', 'Headlamp dengan battery rechargeable USB. Brightness adjustable dan waterproof.', 30000, 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80', 0.15, '6x4x3 cm', '1 unit', 'Plastic/Silicone', 'Waterproof', 234, 4.6, true),
  
  -- Matras
  ('Matras Foam Single', (SELECT id FROM equipment_categories WHERE name = 'Matras'), 'Kasur busa untuk single', 'Matras foam yang nyaman dan portabel. Memberikan kenyamanan tidur di atas tanah.', 25000, 'https://images.unsplash.com/photo-1515431907191-a1dd8c9b95a9?w=800&q=80', 1.8, '190x60x3 cm', '1 orang', 'High Density Foam', 'All Weather', 123, 4.4, true),
  ('Matras Inflatable Double', (SELECT id FROM equipment_categories WHERE name = 'Matras'), 'Kasur angin untuk double', 'Matras angin yang mudah dipompa dan nyaman. Tahan bocor dan material berkualitas.', 45000, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', 2.9, '190x120x10 cm', '2 orang', 'TPU', 'All Weather', 67, 4.5, true),
  
  -- Clothing
  ('Jacket Waterproof', (SELECT id FROM equipment_categories WHERE name = 'Clothing'), 'Jaket anti air', 'Jaket waterproof dengan breathable fabric. Cocok untuk hiking dan outdoor activities.', 35000, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80', 0.8, 'All Size', '1 orang', 'Gore-Tex', 'Waterproof', 89, 4.7, true),
  ('Pants Hiking Quick Dry', (SELECT id FROM equipment_categories WHERE name = 'Clothing'), 'Celana hiking quick dry', 'Celana hiking dengan material quick dry dan UV protection. Nyaman untuk hiking jarak jauh.', 25000, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', 0.4, 'All Size', '1 orang', 'Polyester', 'All Weather', 156, 4.4, true),
  
  -- Navigation
  ('GPS Handheld', (SELECT id FROM equipment_categories WHERE name = 'Navigation'), 'GPS handheld untuk tracking', 'GPS handheld dengan layar besar dan battery awet. Dilengkapi dengan peta Indonesia.', 85000, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', 0.2, '1 unit', '1 unit', 'Plastic/Rubber', 'Waterproof', 23, 4.8, true),
  ('Kompas Profesional', (SELECT id FROM equipment_categories WHERE name = 'Navigation'), 'Kompas hiking profesional', 'Kompas dengan akurasi tinggi dan housing metal. Essential untuk navigation.', 15000, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', 0.1, '1 unit', '1 unit', 'Metal', 'All Weather', 267, 4.3, true),
  
  -- Safety
  ('First Aid Kit Complete', (SELECT id FROM equipment_categories WHERE name = 'Safety'), 'P3K lengkap untuk outdoor', 'First aid kit lengkap dengan obat-obatan esensial untuk outdoor. Compact dan organized.', 30000, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', 0.5, '20x15x8 cm', '1 kit', 'Nylon', 'All Weather', 198, 4.6, true),
  ('Emergency Whistle', (SELECT id FROM equipment_categories WHERE name = 'Safety'), 'Peluit darurat', 'Peluit emergency dengan suara keras dan compass built-in. Essential untuk safety.', 8000, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', 0.05, '1 unit', '1 unit', 'Plastic', 'All Weather', 312, 4.2, true),
  
  -- Accessories
  ('Multi-tool Pocket Knife', (SELECT id FROM equipment_categories WHERE name = 'Accessories'), 'Pisau serbaguna pocket', 'Multi-tool dengan 12 fungsi: pisau, gunting, pembuka botol, dll. Essential untuk outdoor.', 45000, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', 0.3, '1 unit', '1 unit', 'Stainless Steel', 'All Weather', 145, 4.7, true),
  ('Dry Bag 30L', (SELECT id FROM equipment_categories WHERE name = 'Accessories'), 'Tas anti air 30L', 'Dry bag dengan roll-top closure. Melindungi barang dari air dan debu.', 20000, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', 0.6, '30L', '30L', 'PVC Tarpaulin', 'Waterproof', 289, 4.5, true)
);

-- Update rental_count to reflect popularity
UPDATE equipment SET rental_count = rental_count + FLOOR(RANDOM() * 50) + 10 WHERE rental_count < 50;

-- Update some ratings to be more realistic
UPDATE equipment SET average_rating = ROUND((RANDOM() * 1.5 + 3.5)::numeric, 1) WHERE average_rating > 4.5;
