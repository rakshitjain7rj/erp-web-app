-- Moved from project root: add_production_at_100_to_entries.sql
-- Purpose: Store production@100 snapshot on entries

ALTER TABLE asu_production_entries 
ADD COLUMN IF NOT EXISTS production_at_100 DECIMAL(10, 2);

UPDATE asu_production_entries 
SET production_at_100 = am.production_at_100
FROM asu_machines am
WHERE asu_production_entries.machine_no = am.machine_no 
  AND asu_production_entries.unit = am.unit
  AND asu_production_entries.production_at_100 IS NULL;

UPDATE asu_production_entries 
SET production_at_100 = 400.00
WHERE production_at_100 IS NULL;

COMMENT ON COLUMN asu_production_entries.production_at_100 IS 'Production@100% value from machine configuration at the time of entry creation.';
