-- Alternative migration without foreign key constraints
-- Use this if the previous migration still causes issues

-- Step 1: Ensure Users table exists with system user
CREATE TABLE IF NOT EXISTS "Users" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'storekeeper',
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Insert system user if not exists
INSERT INTO "Users" (id, name, email, password, role, "createdAt", "updatedAt")
VALUES (1, 'System User', 'system@example.com', '$2b$10$example', 'admin', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Step 2: Add columns to DyeingFollowUps without foreign key constraints
ALTER TABLE "DyeingFollowUps" 
ADD COLUMN IF NOT EXISTS "addedBy" INTEGER DEFAULT 1;

ALTER TABLE "DyeingFollowUps" 
ADD COLUMN IF NOT EXISTS "addedByName" VARCHAR(255) DEFAULT 'System User';

-- Step 3: Update existing records
UPDATE "DyeingFollowUps" 
SET "addedBy" = 1, "addedByName" = 'System User'
WHERE "addedBy" IS NULL OR "addedByName" IS NULL;

-- Step 4: Create indexes for better performance (optional)
CREATE INDEX IF NOT EXISTS idx_dyeing_followups_added_by ON "DyeingFollowUps"("addedBy");
CREATE INDEX IF NOT EXISTS idx_dyeing_followups_dyeing_record_id ON "DyeingFollowUps"("dyeingRecordId");

-- Verify the structure
\d "DyeingFollowUps"
