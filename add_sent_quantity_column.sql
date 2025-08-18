-- Add sentQuantity column to CountProducts table
-- This migration adds the sentQuantity field to track sent to dye quantity separately from main quantity

-- Add the sentQuantity column
ALTER TABLE "CountProducts" 
ADD COLUMN "sentQuantity" DECIMAL(10,2);

-- Set default values for existing records (copy from quantity)
UPDATE "CountProducts" 
SET "sentQuantity" = "quantity" 
WHERE "sentQuantity" IS NULL;

-- Verify the migration
SELECT id, "partyName", "quantity", "sentQuantity" 
FROM "CountProducts" 
LIMIT 5;

-- Log the completion
SELECT 'sentQuantity column added successfully to CountProducts table' as migration_status;
