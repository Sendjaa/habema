-- OpenTrip CRUD System Migration
-- Created: 2026-11-20
-- Description: Core tables for Open Trip management system
-- Prefix 'ot_' added to avoid conflicts with existing rental system tables

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. OT_TRIP_CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS ot_trip_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NULL,
    icon VARCHAR(50) NULL,
    color VARCHAR(20) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ot_trip_categories_active ON ot_trip_categories(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_ot_trip_categories_slug ON ot_trip_categories(slug);

-- ============================================================
-- 2. OT_TRIPS (Open Trip Packages)
-- ============================================================
CREATE TABLE IF NOT EXISTS ot_trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Info
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500) NULL,
    
    -- Location
    destination VARCHAR(255) NOT NULL,
    destination_region VARCHAR(100) NULL,
    pickup_location VARCHAR(255) NULL,
    dropoff_location VARCHAR(255) NULL,
    
    -- Pricing
    base_price DECIMAL(12, 2) NOT NULL CHECK (base_price > 0),
    discount_price DECIMAL(12, 2) DEFAULT 0 CHECK (discount_price >= 0),
    tax_amount DECIMAL(12, 2) DEFAULT 0 CHECK (tax_amount >= 0),
    final_price DECIMAL(12, 2) NOT NULL CHECK (final_price >= 0),
    currency VARCHAR(3) DEFAULT 'IDR',
    
    -- Duration & Capacity
    duration_days INTEGER NOT NULL CHECK (duration_days > 0),
    duration_nights INTEGER NOT NULL CHECK (duration_nights >= 0),
    min_participants INTEGER DEFAULT 1 CHECK (min_participants > 0),
    max_participants INTEGER NOT NULL CHECK (max_participants > 0),
    current_participants INTEGER DEFAULT 0 CHECK (current_participants >= 0),
    
    -- Schedule
    departure_date TIMESTAMP WITH TIME ZONE NOT NULL,
    return_date TIMESTAMP WITH TIME ZONE NOT NULL,
    departure_time TIME NULL,
    return_time TIME NULL,
    
    -- Status & Visibility
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'full', 'cancelled')),
    featured BOOLEAN DEFAULT FALSE,
    priority INTEGER DEFAULT 0,
    
    -- Categorization
    category_id UUID NULL,
    
    -- Media
    featured_image VARCHAR(500) NULL,
    gallery_images JSONB DEFAULT '[]'::jsonb,
    
    -- Content
    itinerary TEXT NULL,
    highlights TEXT NULL,
    inclusions TEXT NULL,
    exclusions TEXT NULL,
    what_to_bring TEXT NULL,
    important_notes TEXT NULL,
    cancellation_policy TEXT NULL,
    refund_policy TEXT NULL,
    faq JSONB DEFAULT '[]'::jsonb,
    
    -- Requirements
    min_age INTEGER NULL,
    max_age INTEGER NULL,
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('easy', 'moderate', 'hard', 'extreme')),
    fitness_required BOOLEAN DEFAULT FALSE,
    
    -- SEO
    meta_title VARCHAR(255) NULL,
    meta_description VARCHAR(500) NULL,
    meta_keywords VARCHAR(500) NULL,
    
    -- Admin
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE NULL,
    archived_at TIMESTAMP WITH TIME ZONE NULL
);

-- Add constraints conditionally (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ot_trips_departure_before_return') THEN
        ALTER TABLE ot_trips ADD CONSTRAINT ot_trips_departure_before_return CHECK (departure_date < return_date);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ot_trips_price_positive') THEN
        ALTER TABLE ot_trips ADD CONSTRAINT ot_trips_price_positive CHECK (final_price >= 0);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ot_trips_participants_check') THEN
        ALTER TABLE ot_trips ADD CONSTRAINT ot_trips_participants_check CHECK (max_participants >= min_participants);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ot_trips_current_participants_check') THEN
        ALTER TABLE ot_trips ADD CONSTRAINT ot_trips_current_participants_check CHECK (current_participants <= max_participants);
    END IF;
END $$;

-- Foreign Keys
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_ot_trips_category') THEN
        ALTER TABLE ot_trips ADD CONSTRAINT fk_ot_trips_category FOREIGN KEY (category_id) REFERENCES ot_trip_categories(id) ON DELETE SET NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_ot_trips_created_by') THEN
        ALTER TABLE ot_trips ADD CONSTRAINT fk_ot_trips_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ot_trips_status ON ot_trips(status);
CREATE INDEX IF NOT EXISTS idx_ot_trips_category ON ot_trips(category_id);
CREATE INDEX IF NOT EXISTS idx_ot_trips_featured ON ot_trips(featured) WHERE featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_ot_trips_departure_date ON ot_trips(departure_date) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_ot_trips_created_by ON ot_trips(created_by);
CREATE INDEX IF NOT EXISTS idx_ot_trips_slug ON ot_trips(slug);
CREATE INDEX IF NOT EXISTS idx_ot_trips_published ON ot_trips(published_at) WHERE published_at IS NOT NULL;

-- ============================================================
-- 3. OT_TRIP_IMAGES (Gallery)
-- ============================================================
CREATE TABLE IF NOT EXISTS ot_trip_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255) NULL,
    sort_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_ot_trip_images_trip FOREIGN KEY (trip_id) REFERENCES ot_trips(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ot_trip_images_trip ON ot_trip_images(trip_id);
CREATE INDEX IF NOT EXISTS idx_ot_trip_images_featured ON ot_trip_images(is_featured) WHERE is_featured = TRUE;

-- ============================================================
-- 4. OT_BOOKINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS ot_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- References
    user_id UUID NOT NULL,
    trip_id UUID NOT NULL,
    
    -- Booking Reference
    booking_code VARCHAR(20) UNIQUE NOT NULL,
    
    -- Participants
    total_participants INTEGER NOT NULL CHECK (total_participants > 0),
    adult_count INTEGER DEFAULT 0 CHECK (adult_count >= 0),
    child_count INTEGER DEFAULT 0 CHECK (child_count >= 0),
    infant_count INTEGER DEFAULT 0 CHECK (infant_count >= 0),
    
    -- Pricing Breakdown
    subtotal_price DECIMAL(12, 2) NOT NULL CHECK (subtotal_price >= 0),
    tax_amount DECIMAL(12, 2) DEFAULT 0 CHECK (tax_amount >= 0),
    discount_amount DECIMAL(12, 2) DEFAULT 0 CHECK (discount_amount >= 0),
    total_price DECIMAL(12, 2) NOT NULL CHECK (total_price >= 0),
    currency VARCHAR(3) DEFAULT 'IDR',
    
    -- Status
    booking_status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (booking_status IN ('pending', 'confirmed', 'cancelled', 'completed', 'refunded', 'expired')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded', 'failed')),
    
    -- Details
    special_requests TEXT NULL,
    participant_details JSONB DEFAULT '[]'::jsonb,
    contact_person_name VARCHAR(255) NULL,
    contact_person_email VARCHAR(255) NULL,
    contact_person_phone VARCHAR(50) NULL,
    
    -- Dates
    booking_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP WITH TIME ZONE NULL,
    cancelled_at TIMESTAMP WITH TIME ZONE NULL,
    cancelled_reason TEXT NULL,
    completed_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT ot_bookings_participants_positive CHECK (total_participants > 0),
    CONSTRAINT ot_bookings_price_non_negative CHECK (total_price >= 0)
);

-- Foreign Keys
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_ot_bookings_user') THEN
        ALTER TABLE ot_bookings ADD CONSTRAINT fk_ot_bookings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_ot_bookings_trip') THEN
        ALTER TABLE ot_bookings ADD CONSTRAINT fk_ot_bookings_trip FOREIGN KEY (trip_id) REFERENCES ot_trips(id) ON DELETE RESTRICT;
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ot_bookings_user ON ot_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_ot_bookings_trip ON ot_bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_ot_bookings_status ON ot_bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_ot_bookings_payment_status ON ot_bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_ot_bookings_code ON ot_bookings(booking_code);
CREATE INDEX IF NOT EXISTS idx_ot_bookings_created ON ot_bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ot_bookings_trip_status ON ot_bookings(trip_id, booking_status);

-- ============================================================
-- 5. OT_PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS ot_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- References
    booking_id UUID NOT NULL,
    
    -- Payment Info
    payment_method VARCHAR(50) NOT NULL 
        CHECK (payment_method IN ('credit_card', 'debit_card', 'bank_transfer', 'e_wallet', 'cash', 'midtrans', 'gopay', 'ovo', 'dana', 'shopeepay', 'qris')),
    payment_provider VARCHAR(100) NULL,
    transaction_id VARCHAR(255) UNIQUE NULL,
    external_transaction_id VARCHAR(255) NULL,
    
    -- Amounts
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    fee_amount DECIMAL(12, 2) DEFAULT 0 CHECK (fee_amount >= 0),
    net_amount DECIMAL(12, 2) NOT NULL CHECK (net_amount >= 0),
    currency VARCHAR(3) DEFAULT 'IDR',
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled', 'expired')),
    
    -- Gateway Response
    gateway_response JSONB NULL,
    failure_reason TEXT NULL,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    idempotency_key VARCHAR(100) UNIQUE NULL,
    
    -- Dates
    initiated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE NULL,
    completed_at TIMESTAMP WITH TIME ZONE NULL,
    failed_at TIMESTAMP WITH TIME ZONE NULL,
    refunded_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT ot_payments_amount_positive CHECK (amount > 0)
);

-- Foreign Keys
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_ot_payments_booking') THEN
        ALTER TABLE ot_payments ADD CONSTRAINT fk_ot_payments_booking FOREIGN KEY (booking_id) REFERENCES ot_bookings(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ot_payments_booking ON ot_payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_ot_payments_status ON ot_payments(status);
CREATE INDEX IF NOT EXISTS idx_ot_payments_transaction ON ot_payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_ot_payments_idempotency ON ot_payments(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_ot_payments_created ON ot_payments(created_at DESC);

-- ============================================================
-- 6. OT_TRIP_REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS ot_trip_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    trip_id UUID NOT NULL,
    user_id UUID NOT NULL,
    booking_id UUID NULL,
    
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200) NULL,
    content TEXT NOT NULL,
    
    pros TEXT NULL,
    cons TEXT NULL,
    
    images JSONB DEFAULT '[]'::jsonb,
    
    is_verified BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    
    admin_response TEXT NULL,
    admin_response_at TIMESTAMP WITH TIME ZONE NULL,
    admin_response_by UUID NULL,
    
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_ot_reviews_trip FOREIGN KEY (trip_id) REFERENCES ot_trips(id) ON DELETE CASCADE,
    CONSTRAINT fk_ot_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ot_reviews_booking FOREIGN KEY (booking_id) REFERENCES ot_bookings(id) ON DELETE SET NULL,
    CONSTRAINT fk_ot_reviews_admin FOREIGN KEY (admin_response_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT ot_reviews_unique_user_trip UNIQUE (trip_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ot_reviews_trip ON ot_trip_reviews(trip_id, is_approved);
CREATE INDEX IF NOT EXISTS idx_ot_reviews_user ON ot_trip_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_ot_reviews_rating ON ot_trip_reviews(rating);

-- ============================================================
-- 7. OT_TRIP_FAVORITES (Wishlist)
-- ============================================================
CREATE TABLE IF NOT EXISTS ot_trip_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    trip_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_ot_favorites_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ot_favorites_trip FOREIGN KEY (trip_id) REFERENCES ot_trips(id) ON DELETE CASCADE,
    CONSTRAINT ot_favorites_unique_user_trip UNIQUE (user_id, trip_id)
);

CREATE INDEX IF NOT EXISTS idx_ot_favorites_user ON ot_trip_favorites(user_id);

-- ============================================================
-- 8. TRIGGERS & FUNCTIONS
-- ============================================================

-- Function to generate booking code
CREATE OR REPLACE FUNCTION generate_ot_booking_code()
RETURNS TRIGGER AS $$
DECLARE
    new_code VARCHAR(20);
    counter INTEGER := 0;
BEGIN
    LOOP
        EXIT WHEN counter >= 10;
        new_code := 'OT-' || TO_CHAR(NOW(), 'YYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        
        IF NOT EXISTS (SELECT 1 FROM ot_bookings WHERE booking_code = new_code) THEN
            NEW.booking_code := new_code;
            RETURN NEW;
        END IF;
        counter := counter + 1;
    END LOOP;
    
    RAISE EXCEPTION 'Failed to generate unique booking code after 10 attempts';
END;
$$ LANGUAGE plpgsql;

-- Function to update trip participant count
CREATE OR REPLACE FUNCTION update_ot_trip_participant_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.booking_status IN ('pending', 'confirmed') THEN
        UPDATE ot_trips 
        SET current_participants = current_participants + NEW.total_participants,
            updated_at = NOW()
        WHERE id = NEW.trip_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.booking_status IN ('pending', 'confirmed') AND NEW.booking_status IN ('cancelled', 'refunded', 'expired') THEN
            UPDATE ot_trips 
            SET current_participants = current_participants - OLD.total_participants,
                updated_at = NOW()
            WHERE id = OLD.trip_id;
        ELSIF OLD.booking_status NOT IN ('pending', 'confirmed') AND NEW.booking_status IN ('pending', 'confirmed') THEN
            UPDATE ot_trips 
            SET current_participants = current_participants + NEW.total_participants,
                updated_at = NOW()
            WHERE id = NEW.trip_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.booking_status IN ('pending', 'confirmed') THEN
            UPDATE ot_trips 
            SET current_participants = current_participants - OLD.total_participants,
                updated_at = NOW()
            WHERE id = OLD.trip_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update booking payment status
CREATE OR REPLACE FUNCTION update_ot_booking_payment_status()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status = 'completed') THEN
        IF NEW.status = 'completed' THEN
            UPDATE ot_bookings 
            SET payment_status = 'paid',
                booking_status = CASE 
                    WHEN booking_status = 'pending' THEN 'confirmed'
                    ELSE booking_status
                END,
                confirmed_at = CASE 
                    WHEN booking_status = 'pending' THEN NOW()
                    ELSE confirmed_at
                END,
                updated_at = NOW()
            WHERE id = NEW.booking_id;
        ELSIF NEW.status = 'failed' OR NEW.status = 'cancelled' THEN
            UPDATE ot_bookings 
            SET payment_status = 'failed',
                updated_at = NOW()
            WHERE id = NEW.booking_id;
        ELSIF NEW.status = 'refunded' THEN
            UPDATE ot_bookings 
            SET payment_status = 'refunded',
                booking_status = 'refunded',
                updated_at = NOW()
            WHERE id = NEW.booking_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Triggers
DROP TRIGGER IF EXISTS trigger_generate_ot_booking_code ON ot_bookings;
CREATE TRIGGER trigger_generate_ot_booking_code
    BEFORE INSERT ON ot_bookings
    FOR EACH ROW EXECUTE FUNCTION generate_ot_booking_code();

DROP TRIGGER IF EXISTS trigger_update_ot_trip_participant_count ON ot_bookings;
CREATE TRIGGER trigger_update_ot_trip_participant_count
    AFTER INSERT OR UPDATE OR DELETE ON ot_bookings
    FOR EACH ROW EXECUTE FUNCTION update_ot_trip_participant_count();

DROP TRIGGER IF EXISTS trigger_update_ot_booking_payment_status ON ot_payments;
CREATE TRIGGER trigger_update_ot_booking_payment_status
    AFTER INSERT OR UPDATE ON ot_payments
    FOR EACH ROW EXECUTE FUNCTION update_ot_booking_payment_status();

-- ============================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE ot_trip_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ot_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE ot_trip_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE ot_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ot_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ot_trip_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE ot_trip_favorites ENABLE ROW LEVEL SECURITY;

-- Ot_trip_categories Policies
CREATE POLICY "ot_trip_categories are viewable by everyone" ON ot_trip_categories
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage ot_trip_categories" ON ot_trip_categories
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- Ot_trips Policies
CREATE POLICY "Published ot_trips are viewable by everyone" ON ot_trips
    FOR SELECT USING (status = 'published');

CREATE POLICY "Users can view own bookings' trips" ON ot_trips
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ot_bookings 
            WHERE ot_bookings.trip_id = ot_trips.id 
            AND ot_bookings.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all ot_trips" ON ot_trips
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

CREATE POLICY "Trip owners can manage their trips" ON ot_trips
    FOR ALL USING (created_by = auth.uid());

-- Ot_bookings Policies
CREATE POLICY "Users can view own bookings" ON ot_bookings
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own bookings" ON ot_bookings
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can cancel own pending bookings" ON ot_bookings
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all ot_bookings" ON ot_bookings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- Ot_payments Policies
CREATE POLICY "Users can view own payments" ON ot_payments
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM ot_bookings WHERE id = ot_payments.booking_id AND user_id = auth.uid())
    );

CREATE POLICY "Users can create payments for own bookings" ON ot_payments
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM ot_bookings WHERE id = ot_payments.booking_id AND user_id = auth.uid())
    );

CREATE POLICY "Admins can manage all ot_payments" ON ot_payments
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- Ot_trip_reviews Policies
CREATE POLICY "Approved ot_trip_reviews are viewable by everyone" ON ot_trip_reviews
    FOR SELECT USING (is_approved = TRUE);

CREATE POLICY "Users can view own reviews" ON ot_trip_reviews
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create reviews for completed trips" ON ot_trip_reviews
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM ot_bookings 
            WHERE ot_bookings.trip_id = ot_trip_reviews.trip_id 
            AND ot_bookings.user_id = auth.uid()
            AND ot_bookings.booking_status = 'completed'
        )
    );

CREATE POLICY "Users can update own reviews" ON ot_trip_reviews
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all ot_trip_reviews" ON ot_trip_reviews
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- Ot_trip_favorites Policies
CREATE POLICY "Users can view own favorites" ON ot_trip_favorites
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own favorites" ON ot_trip_favorites
    FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- 10. DEFAULT DATA
-- ============================================================

-- Insert default trip categories
INSERT INTO ot_trip_categories (name, slug, description, icon, color, sort_order) VALUES
('Open Trip', 'open-trip', 'Perjalanan terbuka untuk siapa saja', '🎒', '#10b981', 1),
('Camping Keluarga', 'camping-keluarga', 'Paket camping untuk keluarga', '🏕️', '#16a34a', 2),
('Private Camp', 'private-camp', 'Area camping privat untuk grup', '🏕️', '#059669', 3),
('Campervan', 'campervan', 'Sewa campervan untuk road trip', '🚐', '#dc2626', 4),
('Paket Rental Grup', 'paket-rental-grup', 'Paket sewa alat untuk grup besar', '📦', '#7c3aed', 5),
('Tracking & Hiking', 'tracking-hiking', 'Paket pendakian dan tracking', '🥾', '#0d9488', 6)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 11. COMMENTS
-- ============================================================

COMMENT ON TABLE ot_trip_categories IS 'Kategori paket open trip';
COMMENT ON TABLE ot_trips IS 'Data paket open trip/wisata';
COMMENT ON TABLE ot_trip_images IS 'Galeri gambar untuk setiap trip';
COMMENT ON TABLE ot_bookings IS 'Data pemesanan pelanggan';
COMMENT ON TABLE ot_payments IS 'Data pembayaran booking';
COMMENT ON TABLE ot_trip_reviews IS 'Ulasan dan rating trip';
COMMENT ON TABLE ot_trip_favorites IS 'Wishlist trip pengguna';

COMMENT ON COLUMN ot_trips.base_price IS 'Harga dasar sebelum diskon';
COMMENT ON COLUMN ot_trips.final_price IS 'Harga final setelah diskon dan pajak';
COMMENT ON COLUMN ot_trips.current_participants IS 'Jumlah peserta terdaftar saat ini (terupdate via trigger)';
COMMENT ON COLUMN ot_bookings.booking_code IS 'Kode unik booking format: OT-YYMMDD-XXXX';
COMMENT ON COLUMN ot_payments.idempotency_key IS 'Key untuk mencegah double payment';

-- ============================================================
-- END OF MIGRATION
-- ============================================================
