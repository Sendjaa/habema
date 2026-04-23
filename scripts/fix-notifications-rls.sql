-- Fix notifications RLS policies for admin access

-- Disable RLS temporarily
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Create admin policy for notifications
CREATE POLICY "Admins can view all notifications" ON public.notifications
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'bibitsayur23@gmail.com'
    )
  );

-- Create admin policy for insert/update
CREATE POLICY "Admins can manage notifications" ON public.notifications
  FOR ALL USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'bibitsayur23@gmail.com'
    )
  );

-- Create system policy for anonymous booking notifications
CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (
    user_id IS NULL OR -- System notifications
    auth.uid() = user_id OR -- User notifications
    (auth.uid() IS NOT NULL AND 
     EXISTS (
       SELECT 1 FROM auth.users 
       WHERE auth.users.id = auth.uid() 
       AND auth.users.email = 'bibitsayur23@gmail.com'
     )) -- Admin can insert
  );

-- Test the policy
SELECT 'Notifications RLS policies updated' as status;
