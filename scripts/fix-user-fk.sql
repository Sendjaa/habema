-- Fix Foreign Key Constraint for user_identity table
-- Option 1: Create trigger to auto-create user record when user authenticates

-- Drop existing foreign key constraint
ALTER TABLE user_identity DROP CONSTRAINT IF EXISTS user_identity_user_id_fkey;

-- Add new foreign key constraint that references auth.users directly
ALTER TABLE user_identity 
ADD CONSTRAINT user_identity_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create trigger to auto-create user record in users table when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires before a new user is inserted into auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Alternative: If you want to keep the original structure, create the user record manually
-- Run this for existing authenticated users:
-- INSERT INTO public.users (id, email, full_name)
-- SELECT id, email, raw_user_meta_data->>'full_name'
-- FROM auth.users 
-- WHERE id NOT IN (SELECT id FROM public.users);

-- Verify the trigger and constraint
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
AND tc.table_name = 'user_identity';
