-- Fix RLS policies for users and user_identity tables
-- This script ensures proper access for identity verification

-- First, ensure RLS is enabled on both tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_identity ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies for users table
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can read all users" ON public.users;

-- Drop all existing policies for user_identity table
DROP POLICY IF EXISTS "Users can see their own identity" ON public.user_identity;
DROP POLICY IF EXISTS "Users can update their own identity" ON public.user_identity;
DROP POLICY IF EXISTS "Users can insert their own identity" ON public.user_identity;

-- Create policies for users table - Allow authenticated users to read users table for FK checks
CREATE POLICY "Allow authenticated users to read users" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create policies for users table - Users can manage their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Create policies for user_identity table
CREATE POLICY "Users can insert their own identity"
  ON public.user_identity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can see their own identity"
  ON public.user_identity FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own identity"
  ON public.user_identity FOR UPDATE
  USING (auth.uid() = user_id);

-- Test the policy
SELECT 'Users RLS policies updated successfully' as status;

-- Verify policies are created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'users';
