-- Add customer_note column to bookings table
-- This fixes the error: Could not find the 'customer_note' column of 'bookings' in the schema cache

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS customer_note TEXT;

-- Also add delivery-related fields that might be missing based on the booking code
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS delivery_option TEXT DEFAULT 'pickup'; -- pickup, delivery

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS delivery_address TEXT;

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS pickup_contact_name TEXT;

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS pickup_contact_phone TEXT;

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT;

-- Update RLS policies to include the new columns if needed
-- The existing policies should already cover these new columns
