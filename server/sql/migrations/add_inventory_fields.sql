-- Moved from project root: add_inventory_fields_migration.sql
-- Purpose: Add missing fields to inventories table

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

UPDATE inventories 
SET 
  "manualQuantity" = COALESCE("manualQuantity", false),
  "manualValue" = COALESCE("manualValue", false),
  "manualYarn" = COALESCE("manualYarn", false)
WHERE 
  "manualQuantity" IS NULL 
  OR "manualValue" IS NULL 
  OR "manualYarn" IS NULL;
