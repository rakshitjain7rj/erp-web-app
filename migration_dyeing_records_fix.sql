-- Migration to fix DyeingRecords table structure
-- This handles the addition of new fields to an existing table with data

-- Step 1: Add new columns as nullable first
ALTER TABLE "DyeingRecords" 
ADD COLUMN IF NOT EXISTS "partyName" VARCHAR(255);

ALTER TABLE "DyeingRecords" 
ADD COLUMN IF NOT EXISTS "quantity" DECIMAL(10,2);

ALTER TABLE "DyeingRecords" 
ADD COLUMN IF NOT EXISTS "shade" VARCHAR(255);

ALTER TABLE "DyeingRecords" 
ADD COLUMN IF NOT EXISTS "count" VARCHAR(255);

ALTER TABLE "DyeingRecords" 
ADD COLUMN IF NOT EXISTS "lot" VARCHAR(255);

ALTER TABLE "DyeingRecords" 
ADD COLUMN IF NOT EXISTS "dyeingFirm" VARCHAR(255);

ALTER TABLE "DyeingRecords" 
ADD COLUMN IF NOT EXISTS "isReprocessing" BOOLEAN DEFAULT FALSE;

ALTER TABLE "DyeingRecords" 
ADD COLUMN IF NOT EXISTS "reprocessingDate" TIMESTAMP;

ALTER TABLE "DyeingRecords" 
ADD COLUMN IF NOT EXISTS "reprocessingReason" TEXT;

-- Step 2: Update existing records with default values
UPDATE "DyeingRecords" 
SET 
  "partyName" = COALESCE("partyName", 'Unknown Party'),
  "quantity" = COALESCE("quantity", 0),
  "shade" = COALESCE("shade", 'Unknown'),
  "count" = COALESCE("count", 'Unknown'),
  "lot" = COALESCE("lot", 'Unknown'),
  "dyeingFirm" = COALESCE("dyeingFirm", 'Unknown Firm'),
  "isReprocessing" = COALESCE("isReprocessing", FALSE)
WHERE 
  "partyName" IS NULL OR 
  "quantity" IS NULL OR 
  "shade" IS NULL OR 
  "count" IS NULL OR 
  "lot" IS NULL OR 
  "dyeingFirm" IS NULL OR 
  "isReprocessing" IS NULL;

-- Step 3: Now apply NOT NULL constraints where needed
ALTER TABLE "DyeingRecords" 
ALTER COLUMN "partyName" SET NOT NULL;

ALTER TABLE "DyeingRecords" 
ALTER COLUMN "quantity" SET NOT NULL;

ALTER TABLE "DyeingRecords" 
ALTER COLUMN "shade" SET NOT NULL;

ALTER TABLE "DyeingRecords" 
ALTER COLUMN "count" SET NOT NULL;

ALTER TABLE "DyeingRecords" 
ALTER COLUMN "lot" SET NOT NULL;

ALTER TABLE "DyeingRecords" 
ALTER COLUMN "dyeingFirm" SET NOT NULL;

ALTER TABLE "DyeingRecords" 
ALTER COLUMN "isReprocessing" SET NOT NULL;

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dyeing_records_party_name ON "DyeingRecords"("partyName");
CREATE INDEX IF NOT EXISTS idx_dyeing_records_sent_date ON "DyeingRecords"("sentDate");
CREATE INDEX IF NOT EXISTS idx_dyeing_records_expected_arrival ON "DyeingRecords"("expectedArrivalDate");
CREATE INDEX IF NOT EXISTS idx_dyeing_records_arrival_date ON "DyeingRecords"("arrivalDate");
CREATE INDEX IF NOT EXISTS idx_dyeing_records_is_reprocessing ON "DyeingRecords"("isReprocessing");

-- Verify the final structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'DyeingRecords' 
ORDER BY ordinal_position;
