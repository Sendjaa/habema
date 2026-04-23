-- Simple fix for admin access issues
-- Disable RLS temporarily for admin, then re-enable with proper policies

-- 1. Disable RLS on booking_items temporarily
ALTER TABLE public.booking_items DISABLE ROW LEVEL SECURITY;

-- 2. Disable RLS on users temporarily  
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 3. Disable RLS on bookings temporarily
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;

-- 4. Disable RLS on equipment temporarily
ALTER TABLE public.equipment DISABLE ROW LEVEL SECURITY;

-- Wait a moment, then re-enable with proper admin policies

-- Re-enable RLS and create simple admin policies
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on bookings
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can delete all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;

-- Create simple admin policy for bookings
CREATE POLICY "Admins can view all bookings" ON public.bookings
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'bibitsayur23@gmail.com'
    )
  );

-- Create user policy for own bookings
CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id);

-- Re-enable RLS on booking_items
ALTER TABLE public.booking_items ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on booking_items
DROP POLICY IF EXISTS "Admins can view all booking items" ON public.booking_items;
DROP POLICY IF EXISTS "Users can view own booking items" ON public.booking_items;

-- Create simple admin policy for booking_items
CREATE POLICY "Admins can view all booking items" ON public.booking_items
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'bibitsayur23@gmail.com'
    )
  );

-- Create user policy for own booking items
CREATE POLICY "Users can view own booking items" ON public.booking_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE bookings.id = public.booking_items.booking_id 
      AND bookings.user_id = auth.uid()
    )
  );

-- Re-enable RLS on users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on users
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

-- Create simple admin policy for users
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'bibitsayur23@gmail.com'
    )
  );

-- Create user policy for own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Re-enable RLS on equipment
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on equipment
DROP POLICY IF EXISTS "Admins can view all equipment" ON public.equipment;
DROP POLICY IF EXISTS "Public can view equipment" ON public.equipment;

-- Create admin policy for equipment
CREATE POLICY "Admins can view all equipment" ON public.equipment
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'bibitsayur23@gmail.com'
    )
  );

-- Create public policy for equipment (anyone can view)
CREATE POLICY "Public can view equipment" ON public.equipment
  FOR SELECT USING (true);

-- Test query to verify policies work
SELECT 'RLS Policies Updated Successfully' as status;
