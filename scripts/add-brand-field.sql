-- Add brand field to equipment table
ALTER TABLE equipment 
ADD COLUMN IF NOT EXISTS brand TEXT;

-- Add comment to describe the field
COMMENT ON COLUMN equipment.brand IS 'Brand/manufacturer of the equipment (e.g., North Face, Coleman, Osprey)';
