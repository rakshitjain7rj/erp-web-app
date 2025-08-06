-- Migration to add productionAt100 field to ASU production entries
-- This ensures historical efficiency calculations remain accurate

BEGIN;

-- Add productionAt100 column to store the machine's productionAt100 value at the time of entry creation
ALTER TABLE asu_production_entries 
ADD COLUMN production_at_100 DECIMAL(10, 2) DEFAULT 87.0;

-- Update existing entries with current machine productionAt100 values
-- This is a one-time data migration
UPDATE asu_production_entries 
SET production_at_100 = COALESCE(
    (SELECT CAST(production_at_100 AS DECIMAL(10, 2)) 
     FROM asu_machines 
     WHERE machine_no = asu_production_entries.machine_no), 
    87.0
);

-- Make the column NOT NULL after setting default values
ALTER TABLE asu_production_entries 
ALTER COLUMN production_at_100 SET NOT NULL;

-- Add index for performance
CREATE INDEX idx_asu_production_entries_production_at_100 
ON asu_production_entries(production_at_100);

-- Add comment for documentation
COMMENT ON COLUMN asu_production_entries.production_at_100 IS 'Historical productionAt100 value from machine configuration at time of entry creation';

COMMIT;
