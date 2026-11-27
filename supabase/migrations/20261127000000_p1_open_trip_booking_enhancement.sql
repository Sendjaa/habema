-- P1: Open Trip Booking Enhancement Migration
-- Created: 2026-11-27
-- Description: Add slot locking, meeting points, rental add-ons, and refund tracking
--              for Open Trip booking system

-- ============================================================
-- 1. ADD EXPIRES_AT TO OT_BOOKINGS (Slot Locking)
-- ============================================================
ALTER TABLE ot_bookings 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE NULL;

COMMENT ON COLUMN ot_bookings.expires_at IS 'Waktu kadaluarsa booking pending (slot lock 20-30 menit)';

-- Index for efficient slot counting queries
CREATE INDEX IF NOT EXISTS idx_ot_bookings_expires 
ON ot_bookings(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================
-- 2. ADD REFUND FIELDS TO OT_BOOKINGS
-- ============================================================
ALTER TABLE ot_bookings 
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(12, 2) DEFAULT 0 CHECK (refund_amount >= 0),
ADD COLUMN IF NOT EXISTS refund_reason TEXT NULL,
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE NULL;

COMMENT ON COLUMN ot_bookings.refund_amount IS 'Nominal refund yang dikembalikan (bisa partial)';
COMMENT ON COLUMN ot_bookings.refund_reason IS 'Alasan refund dari admin';
COMMENT ON COLUMN ot_bookings.refunded_at IS 'Waktu refund diproses';

-- ============================================================
-- 3. ADD MEETING POINTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS ot_meeting_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    lat DECIMAL(10, 6) NULL,
    lng DECIMAL(10, 6) NULL,
    price_adjustment DECIMAL(12, 2) DEFAULT 0 CHECK (price_adjustment >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_ot_meeting_points_trip FOREIGN KEY (trip_id) 
        REFERENCES ot_trips(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ot_meeting_points_trip ON ot_meeting_points(trip_id);
CREATE INDEX IF NOT EXISTS idx_ot_meeting_points_active ON ot_meeting_points(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE ot_meeting_points IS 'Titik kumpul per trip dengan harga berbeda';

-- ============================================================
-- 4. ADD MEETING_POINT_ID TO OT_BOOKINGS
-- ============================================================
ALTER TABLE ot_bookings 
ADD COLUMN IF NOT EXISTS meeting_point_id UUID NULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_ot_bookings_meeting_point') THEN
        ALTER TABLE ot_bookings ADD CONSTRAINT fk_ot_bookings_meeting_point 
            FOREIGN KEY (meeting_point_id) REFERENCES ot_meeting_points(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ot_bookings_meeting_point ON ot_bookings(meeting_point_id);

-- ============================================================
-- 5. ADD OPTIONAL CUSTOM WA NUMBER TO OT_TRIPS
-- ============================================================
ALTER TABLE ot_trips 
ADD COLUMN IF NOT EXISTS custom_wa_number VARCHAR(50) NULL;

COMMENT ON COLUMN ot_trips.custom_wa_number IS 'Nomor WhatsApp PIC trip (opsional, fallback ke CS utama)';

-- ============================================================
-- 6. RENTAL ADD-ONS TABLE (Connect to Branch Inventory)
-- ============================================================
CREATE TABLE IF NOT EXISTS ot_rental_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL,
    equipment_id UUID NOT NULL,
    branch_id UUID NULL,
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    price_per_unit DECIMAL(12, 2) NOT NULL CHECK (price_per_unit >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_ot_rental_addons_trip FOREIGN KEY (trip_id) 
        REFERENCES ot_trips(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ot_rental_addons_trip ON ot_rental_addons(trip_id);
CREATE INDEX IF NOT EXISTS idx_ot_rental_addons_equipment ON ot_rental_addons(equipment_id);
CREATE INDEX IF NOT EXISTS idx_ot_rental_addons_active ON ot_rental_addons(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE ot_rental_addons IS 'Add-on sewa perlengkapan per trip, terhubung ke branch_inventory';

-- ============================================================
-- 7. ADD RENTAL ADD-ONS TO BOOKINGS (JSONB for flexibility)
-- ============================================================
ALTER TABLE ot_bookings 
ADD COLUMN IF NOT EXISTS rental_addons JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN ot_bookings.rental_addons IS 'Daftar add-on rental yang dipesan: [{addon_id, equipment_id, quantity, price}]';

-- ============================================================
-- 8. ADD SLOT LOCK HELPER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION count_available_slots(p_trip_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_max_participants INTEGER;
    v_booked_slots INTEGER;
    v_pending_slots INTEGER;
    v_available INTEGER;
BEGIN
    -- Get max participants
    SELECT max_participants INTO v_max_participants 
    FROM ot_trips WHERE id = p_trip_id;
    
    IF v_max_participants IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Count confirmed/paid slots
    SELECT COALESCE(SUM(total_participants), 0) INTO v_booked_slots
    FROM ot_bookings
    WHERE trip_id = p_trip_id
      AND booking_status IN ('confirmed', 'completed')
      AND payment_status IN ('paid', 'partial');
    
    -- Count pending slots that haven't expired
    SELECT COALESCE(SUM(total_participants), 0) INTO v_pending_slots
    FROM ot_bookings
    WHERE trip_id = p_trip_id
      AND booking_status = 'pending'
      AND (expires_at IS NULL OR expires_at > NOW());
    
    v_available := v_max_participants - v_booked_slots - v_pending_slots;
    RETURN GREATEST(0, v_available);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 9. UPDATE EXISTING PENDING BOOKINGS WITH EXPIRES_AT
-- ============================================================
UPDATE ot_bookings 
SET expires_at = booking_date + INTERVAL '30 minutes'
WHERE booking_status = 'pending' 
  AND payment_status = 'pending'
  AND expires_at IS NULL;

-- ============================================================
-- 10. CREATE INDEX FOR SLOT COUNTING PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_ot_bookings_slot_count 
ON ot_bookings(trip_id, booking_status, payment_status) 
WHERE booking_status IN ('pending', 'confirmed', 'completed');

-- ============================================================
-- END OF MIGRATION
-- ============================================================