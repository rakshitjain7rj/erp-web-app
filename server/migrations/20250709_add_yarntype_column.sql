-- Migration script to add yarn_type column to asu_machines table

-- First check if the column exists
DO $$
BEGIN
    IF NOT EXISTS(
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'asu_machines'
        AND column_name = 'yarn_type'
    ) THEN
        -- Add the yarn_type column
        ALTER TABLE asu_machines
        ADD COLUMN yarn_type VARCHAR(255) NOT NULL DEFAULT 'Cotton';
        
        -- Log the migration
        RAISE NOTICE 'Added yarn_type column to asu_machines table';
    ELSE
        RAISE NOTICE 'yarn_type column already exists in asu_machines table';
    END IF;
END $$;

-- Update existing records to set Cotton as default
UPDATE asu_machines
SET yarn_type = 'Cotton'
WHERE yarn_type IS NULL;
