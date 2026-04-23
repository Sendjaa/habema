-- Fix Foreign Key Constraint for bookings table
-- Apply same fix as user_identity table

-- Drop existing foreign key constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_user_id_fkey;

-- Add new foreign key constraint that references auth.users directly
ALTER TABLE bookings 
ADD CONSTRAINT bookings_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Also fix other tables that might have the same issue
-- Check and fix booking_items table
ALTER TABLE booking_items DROP CONSTRAINT IF EXISTS booking_items_booking_id_fkey;
-- Note: booking_items.booking_id references bookings.id, so this should be fine

-- Check and fix booking_bundle_items table  
ALTER TABLE booking_bundle_items DROP CONSTRAINT IF EXISTS booking_bundle_items_booking_id_fkey;
-- Note: booking_bundle_items.booking_id references bookings.id, so this should be fine

-- Verify all foreign key constraints for bookings related tables
SELECT 
  tc.table_name, 
  tc.constraint_name, 
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('bookings', 'booking_items', 'booking_bundle_items')
ORDER BY tc.table_name, tc.constraint_name;
