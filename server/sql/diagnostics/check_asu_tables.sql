-- Moved from project root: check_asu_tables.sql
-- Purpose: Verify ASU table existence and columns

SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'asu_production_entries'
) AS table_exists;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'asu_production_entries'
ORDER BY ordinal_position;

SELECT EXISTS (
   SELECT FROM information_schema.columns 
   WHERE table_name = 'asu_production_entries' 
   AND column_name = 'unit'
) AS unit_column_exists;
