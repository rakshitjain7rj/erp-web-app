-- complete_count_product_migration.sql
-- Direct SQL to create CountProductFollowUp table

-- Drop table if exists
DROP TABLE IF EXISTS "CountProductFollowUps" CASCADE;

-- Create the CountProductFollowUps table
CREATE TABLE "CountProductFollowUps" (
  "id" SERIAL PRIMARY KEY,
  "countProductId" INTEGER NOT NULL,
  "followUpDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "remarks" TEXT NOT NULL,
  "addedBy" INTEGER DEFAULT 1,
  "addedByName" VARCHAR(255) DEFAULT 'System User',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX "countproductfollowups_countproductid_idx" 
ON "CountProductFollowUps" ("countProductId");

CREATE INDEX "countproductfollowups_addedby_idx" 
ON "CountProductFollowUps" ("addedBy");

-- Insert a test record to verify table works
INSERT INTO "CountProductFollowUps" 
("countProductId", "followUpDate", "remarks", "addedBy", "addedByName", "createdAt", "updatedAt")
VALUES 
(1, NOW(), 'Test follow-up - table creation successful', 1, 'System Test', NOW(), NOW());

-- Query to verify
SELECT * FROM "CountProductFollowUps" WHERE "countProductId" = 1;

-- Clean up test record
DELETE FROM "CountProductFollowUps" WHERE "remarks" = 'Test follow-up - table creation successful';

-- Show final structure
\d "CountProductFollowUps";
