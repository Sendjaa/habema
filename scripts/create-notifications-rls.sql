-- Create RLS policies for notifications table
-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Policy for system/service roles to insert notifications (for anonymous bookings)
CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (
    -- Allow service role or if user_id matches authenticated user or null (system notifications)
    (current_setting('app.config.jwt_role', true) = 'service_role') OR 
    (auth.uid() = user_id) OR
    (user_id IS NULL)
  );

-- Policy for users to view their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- Policy for users to mark notifications as read
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (
    auth.uid() = user_id
  );

-- Policy for admins to view all notifications
CREATE POLICY "Admins can view all notifications" ON public.notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'bibitsayur23@gmail.com'  -- Updated admin email
    )
  );
