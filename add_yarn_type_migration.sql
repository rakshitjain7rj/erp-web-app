-- Migration to add yarn_type column to asu_production_entries table
-- This ensures production entries store their yarn type at creation time

-- Add yarn_type column
ALTER TABLE asu_production_entries 
ADD COLUMN IF NOT EXISTS yarn_type VARCHAR(255);

-- Update existing entries to use their machine's current yarn type
UPDATE asu_production_entries AS pe
SET yarn_type = COALESCE(
  (SELECT m.yarn_type 
   FROM asu_machines AS m 
   WHERE pe.machine_no = m.machine_no 
   LIMIT 1), 
  'Cotton'
)
WHERE pe.yarn_type IS NULL;

-- Set default value and make it NOT NULL
ALTER TABLE asu_production_entries 
ALTER COLUMN yarn_type SET DEFAULT 'Cotton';

ALTER TABLE asu_production_entries 
ALTER COLUMN yarn_type SET NOT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_asu_production_entries_yarn_type 
ON asu_production_entries(yarn_type);

-- Output success message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: Added yarn_type column to asu_production_entries table';
END $$;
