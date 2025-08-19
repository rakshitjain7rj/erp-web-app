-- Moved from project root: add_yarn_type_to_production_entries.sql
-- Purpose: Initial add yarn_type to asu_production_entries

ALTER TABLE asu_production_entries 
ADD COLUMN yarn_type VARCHAR(255) NULL;

UPDATE asu_production_entries AS pe
SET yarn_type = m.yarn_type
FROM asu_machines AS m
WHERE pe.machine_no = m.machine_no;

ALTER TABLE asu_production_entries 
ALTER COLUMN yarn_type SET NOT NULL,
ALTER COLUMN yarn_type SET DEFAULT 'Cotton';

CREATE INDEX IF NOT EXISTS idx_asu_production_entries_yarn_type ON asu_production_entries(yarn_type);
