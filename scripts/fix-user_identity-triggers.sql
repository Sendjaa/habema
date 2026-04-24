-- Fix triggers for user_identity table
-- This script creates triggers to automatically update updated_at timestamp

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_user_identity_updated_at ON user_identity;

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_identity table
CREATE TRIGGER update_user_identity_updated_at
    BEFORE UPDATE ON user_identity
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify trigger is created (using pg_trigger for PostgreSQL)
SELECT 
    t.tgname as triggername,
    c.relname as tablename,
    n.nspname as schemaname
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'user_identity'
AND NOT t.tgisinternal;

-- Alternative verification using information_schema
SELECT 
    trigger_schema,
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'user_identity';
