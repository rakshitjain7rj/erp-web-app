-- Moved from project root: fix_users_table.sql
-- Purpose: Add missing columns and enum type

ALTER TABLE "Users" 
ADD COLUMN IF NOT EXISTS "status" VARCHAR(255) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS "loginHistory" JSONB DEFAULT '[]'::jsonb;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'enum_Users_status'
    ) THEN
        CREATE TYPE enum_Users_status AS ENUM ('active', 'inactive');
    END IF;
END $$;

ALTER TABLE "Users" 
ALTER COLUMN "status" TYPE enum_Users_status USING "status"::enum_Users_status;
