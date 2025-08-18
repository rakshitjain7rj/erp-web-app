-- Fix DyeingFirms table schema by adding missing columns
ALTER TABLE "DyeingFirms" ADD COLUMN IF NOT EXISTS "phoneNumber" VARCHAR(20);
ALTER TABLE "DyeingFirms" ADD COLUMN IF NOT EXISTS "email" VARCHAR(255);
ALTER TABLE "DyeingFirms" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "DyeingFirms" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'DyeingFirms' 
ORDER BY ordinal_position;
