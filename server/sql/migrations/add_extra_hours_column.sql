-- Moved from project root: add_extra_hours_column.sql
-- Purpose: Add extra_hours column to asu_daily_machine_data

ALTER TABLE asu_daily_machine_data 
ADD COLUMN IF NOT EXISTS extra_hours DECIMAL(4,1) DEFAULT 0 CHECK (extra_hours >= 0 AND extra_hours <= 24);

ALTER TABLE asu_daily_machine_data 
ALTER COLUMN extra_hours SET NOT NULL;

COMMENT ON COLUMN asu_daily_machine_data.extra_hours IS 'Optional extra/overtime hours beyond normal working hours';
