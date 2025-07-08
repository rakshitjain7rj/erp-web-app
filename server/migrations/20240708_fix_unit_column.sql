-- Fix Unit Column in ASU Production Entries Table
-- This script checks if the unit column exists and adds it if missing

DO $$
BEGIN
    -- Check if the unit column exists
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'asu_production_entries' 
        AND column_name = 'unit'
    ) THEN
        -- Add the unit column
        EXECUTE 'ALTER TABLE asu_production_entries ADD COLUMN unit INTEGER NOT NULL DEFAULT 1';
        EXECUTE 'ALTER TABLE asu_production_entries ADD CONSTRAINT unit_check CHECK (unit IN (1, 2))';
        
        -- Create an index for better performance
        EXECUTE 'CREATE INDEX idx_asu_production_entries_unit ON asu_production_entries(unit)';
        
        -- Update unique constraint to include unit
        EXECUTE 'ALTER TABLE asu_production_entries DROP CONSTRAINT IF EXISTS unique_machine_date_shift';
        EXECUTE 'ALTER TABLE asu_production_entries ADD CONSTRAINT unique_unit_machine_date_shift UNIQUE (unit, machine_number, date, shift)';
        
        RAISE NOTICE 'Added unit column to asu_production_entries table';
    ELSE
        RAISE NOTICE 'unit column already exists in asu_production_entries table';
    END IF;
END $$;
