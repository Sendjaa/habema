-- Temporary fix: Disable RLS for admin access
-- Run this in Supabase SQL Editor to fix permission issues

-- 1. Disable RLS temporarily (quick fix)
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment DISABLE ROW LEVEL SECURITY;

-- 2. If you want to keep RLS enabled but allow admin access, use these policies instead:
-- Uncomment the following if you prefer RLS with admin policies:

/*
-- Enable RLS first
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for all users" ON public.bookings;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.bookings;
DROP POLICY IF EXISTS "Enable update for all users" ON public.bookings;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.bookings;

-- Create simple admin policies
CREATE POLICY "Admin full access" ON public.bookings
  FOR ALL USING (
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Admin full access" ON public.booking_items
  FOR ALL USING (
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Admin full access" ON public.equipment
  FOR ALL USING (
    auth.uid() IS NOT NULL
  );
*/

-- 3. Grant permissions to authenticated users
GRANT ALL ON public.bookings TO authenticated;
GRANT ALL ON public.booking_items TO authenticated;
GRANT ALL ON public.equipment TO authenticated;

-- 4. Test query
SELECT 'RLS disabled successfully' as status;
