-- Migration to add missing fields to inventories table
-- Run this on your PostgreSQL database

-- Add new columns to inventories table
ALTER TABLE inventories 
ADD COLUMN IF NOT EXISTS "currentQuantity" DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS "gsm" DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS "totalValue" DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS "warehouseLocation" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "batchNumber" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "supplierName" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "manualQuantity" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "manualValue" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "manualYarn" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "remarks" TEXT;

-- Update any existing records to have default values where needed
UPDATE inventories 
SET 
  "manualQuantity" = COALESCE("manualQuantity", false),
  "manualValue" = COALESCE("manualValue", false),
  "manualYarn" = COALESCE("manualYarn", false)
WHERE 
  "manualQuantity" IS NULL 
  OR "manualValue" IS NULL 
  OR "manualYarn" IS NULL;

-- Verify the migration
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'inventories'
ORDER BY ordinal_position;

-- Display current inventory count
SELECT COUNT(*) as total_inventory_items FROM inventories;

COMMIT;
