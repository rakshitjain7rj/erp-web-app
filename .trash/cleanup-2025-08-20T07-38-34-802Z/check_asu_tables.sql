-- Check if asu_production_entries table exists and show its structure
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'asu_production_entries'
) AS table_exists;

-- Show all columns in the asu_production_entries table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'asu_production_entries'
ORDER BY ordinal_position;

-- Check if the 'unit' column exists specifically
SELECT EXISTS (
   SELECT FROM information_schema.columns 
   WHERE table_name = 'asu_production_entries' 
   AND column_name = 'unit'
) AS unit_column_exists;
