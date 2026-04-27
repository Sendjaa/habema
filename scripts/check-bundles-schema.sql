-- Check the actual structure of the bundles table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'bundles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also check if the table exists at all
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'bundles' 
    AND table_schema = 'public'
) as bundles_table_exists;

-- Show a sample of existing data if any
SELECT 'Sample data:' as info;
SELECT * FROM public.bundles LIMIT 3;
