-- Moved from project root: add_yarn_type_migration.sql
-- Purpose: Add yarn_type to asu_production_entries

ALTER TABLE asu_production_entries 
ADD COLUMN IF NOT EXISTS yarn_type VARCHAR(255);

UPDATE asu_production_entries AS pe
SET yarn_type = COALESCE(
  (SELECT m.yarn_type 
   FROM asu_machines AS m 
   WHERE pe.machine_no = m.machine_no 
   LIMIT 1), 
  'Cotton'
)
WHERE pe.yarn_type IS NULL;

ALTER TABLE asu_production_entries 
ALTER COLUMN yarn_type SET DEFAULT 'Cotton';

ALTER TABLE asu_production_entries 
ALTER COLUMN yarn_type SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_asu_production_entries_yarn_type 
ON asu_production_entries(yarn_type);
