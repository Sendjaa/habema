-- Create proper foreign key relationships for booking tables

-- First, check if booking_items has booking_id column
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'booking_items'
AND table_schema = 'public'
AND column_name = 'booking_id';

-- If booking_id doesn't exist, add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'booking_items' 
        AND table_schema = 'public'
        AND column_name = 'booking_id'
    ) THEN
        ALTER TABLE public.booking_items ADD COLUMN booking_id UUID;
    END IF;
END $$;

-- Create foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'booking_items'
        AND tc.table_schema = 'public'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'booking_id'
    ) THEN
        ALTER TABLE public.booking_items 
        ADD CONSTRAINT fk_booking_items_booking_id 
        FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Check if equipment_id exists in booking_items
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'booking_items'
AND table_schema = 'public'
AND column_name = 'equipment_id';

-- If equipment_id doesn't exist, add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'booking_items' 
        AND table_schema = 'public'
        AND column_name = 'equipment_id'
    ) THEN
        ALTER TABLE public.booking_items ADD COLUMN equipment_id UUID;
    END IF;
END $$;

-- Create foreign key constraint for equipment if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'booking_items'
        AND tc.table_schema = 'public'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'equipment_id'
    ) THEN
        ALTER TABLE public.booking_items 
        ADD CONSTRAINT fk_booking_items_equipment_id 
        FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Verify the relationships were created
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

-- Test the relationship with a simple query
SELECT 'Relationships created successfully' as status;
