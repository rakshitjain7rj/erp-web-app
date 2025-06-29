-- Migration to add extra_hours column to asu_daily_machine_data table
-- Run this in your Neon SQL editor

-- Add the extra_hours column
ALTER TABLE asu_daily_machine_data 
ADD COLUMN extra_hours DECIMAL(4,1) DEFAULT 0 CHECK (extra_hours >= 0 AND extra_hours <= 24);

-- Update the column to be NOT NULL with default value
ALTER TABLE asu_daily_machine_data 
ALTER COLUMN extra_hours SET NOT NULL;

-- Add a comment to the column
COMMENT ON COLUMN asu_daily_machine_data.extra_hours IS 'Optional extra/overtime hours beyond normal working hours';

-- Verify the change
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'asu_daily_machine_data' 
AND column_name = 'extra_hours';

-- Show the updated table structure
\d asu_daily_machine_data;
