-- Create RLS policies for admin access to all tables
-- This allows admin (bibitsayur23@gmail.com) to read all data

-- 1. Bookings table policies
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can delete all bookings" ON public.bookings;

-- Create admin policies for bookings
CREATE POLICY "Admins can view all bookings" ON public.bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'bibitsayur23@gmail.com'
    )
  );

CREATE POLICY "Admins can update all bookings" ON public.bookings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'bibitsayur23@gmail.com'
    )
  );

CREATE POLICY "Admins can delete all bookings" ON public.bookings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'bibitsayur23@gmail.com'
    )
  );

-- 2. Users table policies
-- Check if table exists and RLS is enabled
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies
        DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
        DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
        
        -- Create admin policy for users
        CREATE POLICY "Admins can view all users" ON public.users
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM auth.users 
              WHERE auth.users.id = auth.uid() 
              AND auth.users.email = 'bibitsayur23@gmail.com'
            )
          );
          
        -- Create user policy for own profile
        CREATE POLICY "Users can view own profile" ON public.users
          FOR SELECT USING (auth.uid() = id);
    END IF;
END $$;

-- 3. Booking Items table policies
-- Check if table exists and RLS is enabled
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'booking_items' AND table_schema = 'public') THEN
        ALTER TABLE public.booking_items ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies
        DROP POLICY IF EXISTS "Admins can view all booking items" ON public.booking_items;
        DROP POLICY IF EXISTS "Users can view own booking items" ON public.booking_items;
        
        -- Create admin policy for booking items
        CREATE POLICY "Admins can view all booking items" ON public.booking_items
          FOR SELECT USING (
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
              WHERE bookings.id = booking_items.booking_id 
              AND bookings.user_id = auth.uid()
            )
          );
    END IF;
END $$;

-- 4. Addresses table policies (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'addresses' AND table_schema = 'public') THEN
        ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Admins can view all addresses" ON public.addresses;
        
        CREATE POLICY "Admins can view all addresses" ON public.addresses
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM auth.users 
              WHERE auth.users.id = auth.uid() 
              AND auth.users.email = 'bibitsayur23@gmail.com'
            )
          );
    END IF;
END $$;

-- 5. Equipment table policies
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all equipment" ON public.equipment;

-- Create admin policy for equipment
CREATE POLICY "Admins can view all equipment" ON public.equipment
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'bibitsayur23@gmail.com'
    )
  );

-- 6. User Identity table policies (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_identity' AND table_schema = 'public') THEN
        ALTER TABLE public.user_identity ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Admins can view all user_identity" ON public.user_identity;
        
        CREATE POLICY "Admins can view all user_identity" ON public.user_identity
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM auth.users 
              WHERE auth.users.id = auth.uid() 
              AND auth.users.email = 'bibitsayur23@gmail.com'
            )
          );
    END IF;
END $$;
