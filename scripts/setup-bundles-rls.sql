-- Setup RLS policies for bundles table
-- Enable RLS on bundles table
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Bundles are readable by everyone" ON bundles;
DROP POLICY IF EXISTS "Service role can manage bundles" ON bundles;
DROP POLICY IF EXISTS "Anonymous can read bundles" ON bundles;

-- Create policies for bundles table
-- Allow public read access to active bundles
CREATE POLICY "Bundles are readable by everyone" ON bundles 
FOR SELECT USING (is_active = true);

-- Allow service role to do everything
CREATE POLICY "Service role can manage bundles" ON bundles 
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Allow anonymous users to read bundles (for API access)
CREATE POLICY "Anonymous can read bundles" ON bundles 
FOR SELECT USING (is_active = true);

-- Enable RLS on bundles table if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'bundles' 
        AND schemaname = 'public'
    ) THEN
        CREATE TABLE bundles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            description TEXT,
            target_audience TEXT,
            original_price DECIMAL(10, 2),
            bundle_price DECIMAL(10, 2) NOT NULL,
            discount_percentage DECIMAL(5, 2),
            image_url TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Bundles are readable by everyone" ON bundles 
        FOR SELECT USING (is_active = true);
        
        CREATE POLICY "Service role can manage bundles" ON bundles 
        FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
        
        CREATE POLICY "Anonymous can read bundles" ON bundles 
        FOR SELECT USING (is_active = true);
    END IF;
END $$;
