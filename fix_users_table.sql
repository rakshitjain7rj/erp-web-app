-- Migration to add missing columns to Users table
-- Run this SQL to fix the database schema

ALTER TABLE "Users" 
ADD COLUMN IF NOT EXISTS "status" VARCHAR(255) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS "loginHistory" JSONB DEFAULT '[]'::jsonb;

-- Add constraint for status enum
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'enum_Users_status'
    ) THEN
        CREATE TYPE enum_Users_status AS ENUM ('active', 'inactive');
    END IF;
END $$;

-- Alter the status column to use the enum type
ALTER TABLE "Users" 
ALTER COLUMN "status" TYPE enum_Users_status USING "status"::enum_Users_status;
