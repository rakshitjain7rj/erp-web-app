-- Add production_at_100 column to asu_production_entries
-- This stores the machine's production@100% value at the time of entry creation
-- Ensures efficiency calculations remain accurate when machine configurations change

-- Add the column
ALTER TABLE asu_production_entries 
ADD COLUMN IF NOT EXISTS production_at_100 DECIMAL(10, 2);

-- Update existing entries with current machine configuration values
UPDATE asu_production_entries 
SET production_at_100 = am.production_at_100
FROM asu_machines am
WHERE asu_production_entries.machine_no = am.machine_no 
  AND asu_production_entries.unit = am.unit
  AND asu_production_entries.production_at_100 IS NULL;

-- Set default value for any entries that still don't have a value
UPDATE asu_production_entries 
SET production_at_100 = 400.00
WHERE production_at_100 IS NULL;

-- Add a comment to document the purpose
COMMENT ON COLUMN asu_production_entries.production_at_100 IS 'Production@100% value from machine configuration at the time of entry creation. Used for accurate efficiency calculations that remain stable when machine configurations change.';
