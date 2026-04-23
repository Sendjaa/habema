-- Check for booking patterns and debug missing booking ID
-- This script helps investigate why booking ID HBM-3FOP8A3SJ is not in database

-- 1. Check all bookings in database
SELECT 
  id,
  user_id,
  status,
  start_date,
  end_date,
  total_cost,
  created_at
FROM bookings 
ORDER BY created_at DESC 
LIMIT 20;

-- 2. Check if there are any bookings with similar ID patterns
SELECT * FROM bookings 
WHERE id::text ILIKE '%3FOP8A3SJ%' 
OR id::text ILIKE '%HBM-%'
ORDER BY created_at DESC;

-- 3. Check booking items for any reference
SELECT 
  bi.*,
  b.user_id,
  b.status,
  b.created_at
FROM booking_items bi
JOIN bookings b ON bi.booking_id = b.id
WHERE bi.booking_id::text ILIKE '%3FOP8A3SJ%'
OR bi.booking_id::text ILIKE '%HBM-%'
ORDER BY b.created_at DESC;

-- 4. Check all recent bookings (last 24 hours)
SELECT 
  id,
  user_id,
  status,
  total_cost,
  created_at,
  CASE 
    WHEN user_id IS NULL THEN 'Anonymous Booking'
    ELSE 'Authenticated Booking'
  END as booking_type
FROM bookings 
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- 5. Count bookings by user type
SELECT 
  COUNT(*) as total_bookings,
  COUNT(CASE WHEN user_id IS NULL THEN 1 END) as anonymous_bookings,
  COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as authenticated_bookings
FROM bookings;

-- 6. Check for any booking patterns that might match local booking IDs
-- Local bookings use format: local_timestamp_randomstring
SELECT * FROM bookings 
WHERE id::text LIKE 'local_%'
ORDER BY created_at DESC;
