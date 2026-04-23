-- Check booking and booking_items table relationships

-- Check if booking_items table exists
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'booking_items' 
    AND table_schema = 'public'
) as booking_items_exists;

-- Check if bookings table exists
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'bookings' 
    AND table_schema = 'public'
) as bookings_exists;

-- Check booking_items table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'booking_items' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check foreign key constraints on booking_items
SELECT
    tc.constraint_name,
    tc.table_name,
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
AND tc.table_name = 'booking_items'
AND tc.table_schema = 'public';

-- Check what tables exist that might be related
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%booking%'
ORDER BY table_name;
