-- Migration: Create DyeingFirms and CountProducts tables
-- Date: 2025-01-10
-- Purpose: Fix missing tables causing "relation does not exist" errors

BEGIN;

-- Create DyeingFirms table
CREATE TABLE IF NOT EXISTS "DyeingFirms" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL UNIQUE,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create CountProducts table  
CREATE TABLE IF NOT EXISTS "CountProducts" (
    "id" SERIAL PRIMARY KEY,
    "quantity" DECIMAL(10,2) NOT NULL,
    "customerName" VARCHAR(255) NOT NULL,
    "sentToDye" DECIMAL(10,2) DEFAULT 0,
    "sentDate" DATE,
    "receivedQuantity" DECIMAL(10,2) DEFAULT 0,
    "receivedDate" DATE,
    "dispatchQuantity" DECIMAL(10,2) DEFAULT 0,
    "dispatchDate" DATE,
    "dyeingFirm" VARCHAR(255) NOT NULL,
    "partyName" VARCHAR(255),
    "middleman" VARCHAR(255) DEFAULT 'Direct',
    "grade" VARCHAR(10) DEFAULT 'A',
    "remarks" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default dyeing firms
INSERT INTO "DyeingFirms" ("name", "isActive") VALUES 
    ('Rainbow Dyers', true),
    ('Spectrum Colors', true),
    ('Azure Dyeing Works', true),
    ('Crimson Textile Dyers', true),
    ('Prism Dyeing Co.', true),
    ('Vibrant Colors Ltd.', true)
ON CONFLICT ("name") DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_dyeing_firms_name" ON "DyeingFirms" ("name");
CREATE INDEX IF NOT EXISTS "idx_dyeing_firms_active" ON "DyeingFirms" ("isActive");
CREATE INDEX IF NOT EXISTS "idx_count_products_dyeing_firm" ON "CountProducts" ("dyeingFirm");
CREATE INDEX IF NOT EXISTS "idx_count_products_customer" ON "CountProducts" ("customerName");
CREATE INDEX IF NOT EXISTS "idx_count_products_created" ON "CountProducts" ("createdAt");

-- Create function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updatedAt
DROP TRIGGER IF EXISTS update_dyeing_firms_updated_at ON "DyeingFirms";
CREATE TRIGGER update_dyeing_firms_updated_at 
    BEFORE UPDATE ON "DyeingFirms" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_count_products_updated_at ON "CountProducts";
CREATE TRIGGER update_count_products_updated_at 
    BEFORE UPDATE ON "CountProducts" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- Verify the tables were created
SELECT 
    t.table_name,
    t.table_schema,
    CASE 
        WHEN t.table_name = 'DyeingFirms' THEN (SELECT COUNT(*) FROM "DyeingFirms")
        WHEN t.table_name = 'CountProducts' THEN (SELECT COUNT(*) FROM "CountProducts")
        ELSE 0 
    END as record_count
FROM information_schema.tables t
WHERE t.table_name IN ('DyeingFirms', 'CountProducts') 
AND t.table_schema = 'public'
ORDER BY t.table_name;
