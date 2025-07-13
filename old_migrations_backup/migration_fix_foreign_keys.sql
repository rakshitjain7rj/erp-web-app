-- Migration to fix foreign key constraints and ensure proper data
-- Run this step by step in your SQL editor

-- Step 1: First, let's check what tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- Step 2: Check if Users table exists and has data
SELECT COUNT(*) as user_count FROM "Users";

-- Step 3: If Users table is empty, create a default system user
INSERT INTO "Users" (id, name, email, password, role, "createdAt", "updatedAt")
VALUES (1, 'System User', 'system@example.com', '$2b$10$example', 'admin', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Step 4: Check current structure of DyeingFollowUps table
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'DyeingFollowUps' 
ORDER BY ordinal_position;

-- Step 5: Add columns if they don't exist (safe way)
DO $$
BEGIN
    -- Add addedBy column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'DyeingFollowUps' AND column_name = 'addedBy'
    ) THEN
        ALTER TABLE "DyeingFollowUps" 
        ADD COLUMN "addedBy" INTEGER DEFAULT 1;
    END IF;

    -- Add addedByName column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'DyeingFollowUps' AND column_name = 'addedByName'
    ) THEN
        ALTER TABLE "DyeingFollowUps" 
        ADD COLUMN "addedByName" VARCHAR(255) DEFAULT 'System User';
    END IF;
END $$;

-- Step 6: Update any existing NULL values
UPDATE "DyeingFollowUps" 
SET "addedBy" = 1 
WHERE "addedBy" IS NULL;

UPDATE "DyeingFollowUps" 
SET "addedByName" = 'System User' 
WHERE "addedByName" IS NULL;

-- Step 7: Check if foreign key constraint already exists
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'DyeingFollowUps' 
AND constraint_type = 'FOREIGN KEY';

-- Step 8: Add foreign key constraint only if it doesn't exist and Users table exists
DO $$
BEGIN
    -- Check if Users table exists and foreign key doesn't exist
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'Users'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'DyeingFollowUps' 
        AND constraint_name = 'fk_dyeing_followup_added_by'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE "DyeingFollowUps" 
        ADD CONSTRAINT fk_dyeing_followup_added_by 
        FOREIGN KEY ("addedBy") REFERENCES "Users"(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- Step 9: Verify the final structure
SELECT 
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default,
    tc.constraint_type
FROM information_schema.columns c
LEFT JOIN information_schema.key_column_usage kcu ON c.column_name = kcu.column_name AND c.table_name = kcu.table_name
LEFT JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
WHERE c.table_name = 'DyeingFollowUps'
ORDER BY c.ordinal_position;

-- Step 10: Show sample data to verify
SELECT id, "dyeingRecordId", "followUpDate", remarks, "addedBy", "addedByName", "createdAt"
FROM "DyeingFollowUps" 
LIMIT 5;
