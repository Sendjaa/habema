-- Fix RLS Policies for user_identity table
-- This script creates proper RLS policies for authenticated users

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can see their own identity" ON user_identity;
DROP POLICY IF EXISTS "Users can update their own identity" ON user_identity;
DROP POLICY IF EXISTS "Users can insert their own identity" ON user_identity;

-- Create new RLS policies for user_identity table
-- 1. Users can insert their own identity (only once, since user_id is unique)
CREATE POLICY "Users can insert their own identity"
  ON user_identity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 2. Users can see their own identity
CREATE POLICY "Users can see their own identity"
  ON user_identity FOR SELECT
  USING (auth.uid() = user_id);

-- 3. Users can update their own identity
CREATE POLICY "Users can update their own identity"
  ON user_identity FOR UPDATE
  USING (auth.uid() = user_id);

-- 4. Allow authenticated users to read all identities (optional, for admin purposes)
-- Uncomment if needed:
-- CREATE POLICY "Authenticated users can read all identities"
--   ON user_identity FOR SELECT
--   USING (auth.role() = 'authenticated');

-- Verify policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'user_identity';
