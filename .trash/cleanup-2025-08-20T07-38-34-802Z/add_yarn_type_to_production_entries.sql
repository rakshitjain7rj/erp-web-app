-- Add yarn_type column to asu_production_entries table
ALTER TABLE asu_production_entries 
ADD COLUMN yarn_type VARCHAR(255) NULL;

-- Update existing entries to use the yarn type from their associated machine
UPDATE asu_production_entries AS pe
SET yarn_type = m.yarn_type
FROM asu_machines AS m
WHERE pe.machine_no = m.machine_no;

-- Make the column NOT NULL after updating data
ALTER TABLE asu_production_entries 
ALTER COLUMN yarn_type SET NOT NULL,
ALTER COLUMN yarn_type SET DEFAULT 'Cotton';

-- Add an index on yarn_type for faster queries
CREATE INDEX idx_asu_production_entries_yarn_type ON asu_production_entries(yarn_type);

-- Output a success message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: Added yarn_type column to asu_production_entries table';
END $$;
