-- Moved from project root: database_verification.sql
-- Purpose: Verify tables and structures

SELECT table_name, table_schema FROM information_schema.tables WHERE table_schema = 'public';
