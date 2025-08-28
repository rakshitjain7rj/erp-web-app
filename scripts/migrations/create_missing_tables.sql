-- Create missing tables for ERP system
-- Run this script to create the DyeingFirms and CountProducts tables

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

-- Insert some sample dyeing firms to get started
INSERT INTO "DyeingFirms" ("name", "isActive") VALUES 
    ('Rainbow Dyers', true),
    ('Spectrum Colors', true),
    ('Azure Dyeing Works', true),
    ('Crimson Textile Dyers', true)
ON CONFLICT ("name") DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_dyeing_firms_name" ON "DyeingFirms" ("name");
CREATE INDEX IF NOT EXISTS "idx_dyeing_firms_active" ON "DyeingFirms" ("isActive");
CREATE INDEX IF NOT EXISTS "idx_count_products_dyeing_firm" ON "CountProducts" ("dyeingFirm");
CREATE INDEX IF NOT EXISTS "idx_count_products_customer" ON "CountProducts" ("customerName");
CREATE INDEX IF NOT EXISTS "idx_count_products_created" ON "CountProducts" ("createdAt");

-- Add triggers to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_dyeing_firms_updated_at 
    BEFORE UPDATE ON "DyeingFirms" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_count_products_updated_at 
    BEFORE UPDATE ON "CountProducts" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify tables were created
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name IN ('DyeingFirms', 'CountProducts') 
AND table_schema = 'public';
