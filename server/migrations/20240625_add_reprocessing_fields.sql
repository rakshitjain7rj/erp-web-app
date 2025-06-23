-- Add reprocessing fields to DyeingRecords table
ALTER TABLE "DyeingRecords" 
ADD COLUMN "isReprocessing" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "reprocessingDate" TIMESTAMP WITH TIME ZONE,
ADD COLUMN "reprocessingReason" TEXT;

-- Add indexes for better query performance
CREATE INDEX idx_dyeing_records_is_reprocessing ON "DyeingRecords" ("isReprocessing");
CREATE INDEX idx_dyeing_records_reprocessing_date ON "DyeingRecords" ("reprocessingDate");
