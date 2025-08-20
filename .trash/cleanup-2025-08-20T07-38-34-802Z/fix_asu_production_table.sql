-- Add the 'unit' column to the asu_production_entries table if it doesn't exist

-- First check if column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'asu_production_entries' 
    AND column_name = 'unit'
  ) THEN
    -- Add the unit column with a default value of 1
    EXECUTE 'ALTER TABLE asu_production_entries 
             ADD COLUMN unit INTEGER NOT NULL DEFAULT 1 
             CHECK (unit IN (1, 2))';
             
    -- Create an index for the new column
    EXECUTE 'CREATE INDEX idx_asu_production_entries_unit ON asu_production_entries(unit)';
    
    RAISE NOTICE 'Added unit column to asu_production_entries table';
  ELSE
    RAISE NOTICE 'unit column already exists in asu_production_entries table';
  END IF;
END $$;
