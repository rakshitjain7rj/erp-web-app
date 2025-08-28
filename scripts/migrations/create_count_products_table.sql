-- SQL script to manually create CountProducts table with correct schema
DROP TABLE IF EXISTS "CountProducts";

CREATE TABLE "CountProducts" (
  "id" SERIAL PRIMARY KEY,
  "partyName" VARCHAR(255) NOT NULL,
  "dyeingFirm" VARCHAR(255) NOT NULL,
  "yarnType" VARCHAR(255) NOT NULL,
  "count" VARCHAR(255) NOT NULL,
  "shade" VARCHAR(255) NOT NULL,
  "quantity" DECIMAL(10,2) NOT NULL,
  "completedDate" DATE NOT NULL,
  "qualityGrade" VARCHAR(1) DEFAULT 'A' CHECK ("qualityGrade" IN ('A', 'B', 'C')),
  "remarks" TEXT,
  "lotNumber" VARCHAR(255) NOT NULL UNIQUE,
  "processedBy" VARCHAR(255) DEFAULT 'System',
  "customerName" VARCHAR(255) NOT NULL,
  "sentToDye" BOOLEAN DEFAULT true,
  "sentDate" DATE,
  "received" BOOLEAN DEFAULT false,
  "receivedDate" DATE,
  "receivedQuantity" DECIMAL(10,2) DEFAULT 0,
  "dispatch" BOOLEAN DEFAULT false,
  "dispatchDate" DATE,
  "dispatchQuantity" DECIMAL(10,2) DEFAULT 0,
  "middleman" VARCHAR(255) DEFAULT 'Direct Supply',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX "CountProducts_partyName_idx" ON "CountProducts" ("partyName");
CREATE INDEX "CountProducts_dyeingFirm_idx" ON "CountProducts" ("dyeingFirm");
CREATE INDEX "CountProducts_completedDate_idx" ON "CountProducts" ("completedDate");

-- Create DyeingFirms table if it doesn't exist
CREATE TABLE IF NOT EXISTS "DyeingFirms" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL UNIQUE,
  "contactPerson" VARCHAR(255) DEFAULT 'Manager',
  "phoneNumber" VARCHAR(50),
  "email" VARCHAR(255),
  "address" TEXT,
  "notes" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on name for performance
CREATE INDEX IF NOT EXISTS "DyeingFirms_name_idx" ON "DyeingFirms" ("name");
CREATE INDEX IF NOT EXISTS "DyeingFirms_isActive_idx" ON "DyeingFirms" ("isActive");

SELECT 'Tables created successfully' as status;
