-- Check if users table exists and its structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if table exists at all
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'users' 
    AND table_schema = 'public'
) as users_table_exists;

-- Try a simple query to test access
SELECT 'Testing users table access' as test_query;
SELECT COUNT(*) as total_users FROM public.users LIMIT 1;
