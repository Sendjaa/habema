-- OpenTrip Content CRUD Migration
-- Created: 2026-11-21
-- Description: Tabel konten operasional Open Trip yang sebelumnya ditulis
--              statis di app/opentrip/page.tsx (voucher, gear add-on, FAQ,
--              galeri lapangan). Semua bisa dikelola dari /admin/opentrip.

-- ============================================================
-- 1. OT_VOUCHERS
-- ============================================================
CREATE TABLE IF NOT EXISTS ot_vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    discount_amount DECIMAL(12, 2) NOT NULL CHECK (discount_amount > 0),
    min_participants INTEGER NOT NULL DEFAULT 1 CHECK (min_participants > 0),
    valid_until DATE NULL,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ot_vouchers_active ON ot_vouchers(is_active, sort_order);

-- ============================================================
-- 2. OT_GEAR_ADDONS
-- ============================================================
CREATE TABLE IF NOT EXISTS ot_gear_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    spec VARCHAR(255) NULL,
    price_per_trip DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (price_per_trip >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ot_gear_addons_active ON ot_gear_addons(is_active, sort_order);

-- ============================================================
-- 3. OT_FAQS (FAQ umum halaman Open Trip)
-- ============================================================
CREATE TABLE IF NOT EXISTS ot_faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question VARCHAR(255) NOT NULL,
    answer TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ot_faqs_active ON ot_faqs(is_active, sort_order);

-- ============================================================
-- 4. OT_FIELD_GALLERY (Dokumentasi lapangan / galeri kloter)
-- ============================================================
CREATE TABLE IF NOT EXISTS ot_field_gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url VARCHAR(500) NOT NULL,
    caption VARCHAR(255) NULL,
    location VARCHAR(150) NULL,
    elevation VARCHAR(50) NULL,
    trip_title VARCHAR(150) NULL,
    taken_at DATE NULL,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ot_field_gallery_active ON ot_field_gallery(is_active, sort_order);

-- ============================================================
-- 5. RLS KONTEN PUBLIK
-- ============================================================
ALTER TABLE ot_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ot_gear_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE ot_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ot_field_gallery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active ot_vouchers are viewable by everyone" ON ot_vouchers;
CREATE POLICY "Active ot_vouchers are viewable by everyone" ON ot_vouchers
    FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins can manage ot_vouchers" ON ot_vouchers;
CREATE POLICY "Admins can manage ot_vouchers" ON ot_vouchers
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

DROP POLICY IF EXISTS "Active ot_gear_addons are viewable by everyone" ON ot_gear_addons;
CREATE POLICY "Active ot_gear_addons are viewable by everyone" ON ot_gear_addons
    FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins can manage ot_gear_addons" ON ot_gear_addons;
CREATE POLICY "Admins can manage ot_gear_addons" ON ot_gear_addons
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

DROP POLICY IF EXISTS "Active ot_faqs are viewable by everyone" ON ot_faqs;
CREATE POLICY "Active ot_faqs are viewable by everyone" ON ot_faqs
    FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins can manage ot_faqs" ON ot_faqs;
CREATE POLICY "Admins can manage ot_faqs" ON ot_faqs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

DROP POLICY IF EXISTS "Active ot_field_gallery are viewable by everyone" ON ot_field_gallery;
CREATE POLICY "Active ot_field_gallery are viewable by everyone" ON ot_field_gallery
    FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins can manage ot_field_gallery" ON ot_field_gallery;
CREATE POLICY "Admins can manage ot_field_gallery" ON ot_field_gallery
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- Foto trip sebelumnya tidak punya policy SELECT publik, sehingga join
-- ot_trip_images selalu kosong untuk pengunjung biasa.
DROP POLICY IF EXISTS "ot_trip_images are viewable by everyone" ON ot_trip_images;
CREATE POLICY "ot_trip_images are viewable by everyone" ON ot_trip_images
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins can manage ot_trip_images" ON ot_trip_images;
CREATE POLICY "Admins can manage ot_trip_images" ON ot_trip_images
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

COMMENT ON TABLE ot_vouchers IS 'Voucher diskon yang tampil di halaman Open Trip';
COMMENT ON TABLE ot_gear_addons IS 'Tambahan sewa gear pada kalkulator booking Open Trip';
COMMENT ON TABLE ot_faqs IS 'FAQ umum halaman Open Trip';
COMMENT ON TABLE ot_field_gallery IS 'Galeri dokumentasi lapangan halaman Open Trip';
