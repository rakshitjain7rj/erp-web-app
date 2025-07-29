-- Add machine_name column to asu_machines table
ALTER TABLE asu_machines ADD COLUMN IF NOT EXISTS machine_name VARCHAR(255);

-- Update existing entries to set machine_name based on machineNo
UPDATE asu_machines SET machine_name = CONCAT('Machine ', machine_no) WHERE machine_name IS NULL;

-- Create an index on machine_name
CREATE INDEX IF NOT EXISTS idx_asu_machines_name ON asu_machines (machine_name);
