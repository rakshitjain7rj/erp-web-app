-- Moved from project root: add_machine_name_column.sql
-- Purpose: Add machine_name column to asu_machines

ALTER TABLE asu_machines ADD COLUMN IF NOT EXISTS machine_name VARCHAR(255);

UPDATE asu_machines SET machine_name = CONCAT('Machine ', machine_no) WHERE machine_name IS NULL;

CREATE INDEX IF NOT EXISTS idx_asu_machines_name ON asu_machines (machine_name);
