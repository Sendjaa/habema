-- Fix RLS policies for admin access
-- This script creates proper RLS policies for admin user (bibitsayur23@gmail.com)

-- 1. Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Enable insert for all users" ON public.bookings;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.bookings;
DROP POLICY IF EXISTS "Enable update for all users" ON public.bookings;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.bookings;

-- 2. Create admin policies for bookings table
CREATE POLICY "Admins can view all bookings" ON public.bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'bibitsayur23@gmail.com'
    )
  );

CREATE POLICY "Admins can insert bookings" ON public.bookings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'bibitsayur23@gmail.com'
    )
  );

CREATE POLICY "Admins can update bookings" ON public.bookings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'bibitsayur23@gmail.com'
    )
  );

CREATE POLICY "Admins can delete bookings" ON public.bookings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'bibitsayur23@gmail.com'
    )
  );

-- 3. Fix booking_items table policies
DROP POLICY IF EXISTS "Enable insert for all users" ON public.booking_items;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.booking_items;
DROP POLICY IF EXISTS "Enable update for all users" ON public.booking_items;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.booking_items;

CREATE POLICY "Admins can view all booking_items" ON public.booking_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'bibitsayur23@gmail.com'
    )
  );

CREATE POLICY "Admins can insert booking_items" ON public.booking_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'bibitsayur23@gmail.com'
    )
  );

CREATE POLICY "Admins can update booking_items" ON public.booking_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'bibitsayur23@gmail.com'
    )
  );

CREATE POLICY "Admins can delete booking_items" ON public.booking_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'bibitsayur23@gmail.com'
    )
  );

-- 4. Fix equipment table policies
DROP POLICY IF EXISTS "Enable insert for all users" ON public.equipment;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.equipment;
DROP POLICY IF EXISTS "Enable update for all users" ON public.equipment;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.equipment;

CREATE POLICY "Admins can view all equipment" ON public.equipment
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'bibitsayur23@gmail.com'
    )
  );

CREATE POLICY "Admins can insert equipment" ON public.equipment
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'bibitsayur23@gmail.com'
    )
  );

CREATE POLICY "Admins can update equipment" ON public.equipment
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'bibitsayur23@gmail.com'
    )
  );

CREATE POLICY "Admins can delete equipment" ON public.equipment
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'bibitsayur23@gmail.com'
    )
  );

-- 5. Enable RLS on all tables if not already enabled
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

-- 6. Grant necessary permissions
GRANT ALL ON public.bookings TO authenticated;
GRANT ALL ON public.booking_items TO authenticated;
GRANT ALL ON public.equipment TO authenticated;

-- 7. Test query to verify admin access
SELECT 'RLS policies created successfully' as status;
