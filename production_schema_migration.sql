-- Production Management System Database Schema
-- PostgreSQL Migration Script

-- Create Machines Table
CREATE TABLE IF NOT EXISTS machines (
    id SERIAL PRIMARY KEY,
    "machineId" VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'other' CHECK (type IN ('dyeing', 'spinning', 'weaving', 'finishing', 'other')),
    location VARCHAR(100),
    capacity DECIMAL(10, 2) CHECK (capacity >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
    specifications JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create Production Jobs Table
CREATE TABLE IF NOT EXISTS production_jobs (
    id SERIAL PRIMARY KEY,
    "jobId" VARCHAR(50) UNIQUE NOT NULL,
    "productType" VARCHAR(100) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL CHECK (quantity >= 0.01),
    unit VARCHAR(20) NOT NULL DEFAULT 'kg',
    "machineId" INTEGER REFERENCES machines(id),
    "workerId" INTEGER REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    "startDate" TIMESTAMP WITH TIME ZONE,
    "endDate" TIMESTAMP WITH TIME ZONE,
    "dueDate" TIMESTAMP WITH TIME ZONE,
    "estimatedHours" DECIMAL(8, 2) CHECK ("estimatedHours" >= 0),
    "actualHours" DECIMAL(8, 2) CHECK ("actualHours" >= 0),
    "partyName" VARCHAR(100),
    "dyeingOrderId" INTEGER,
    notes TEXT,
    
    -- Detailed Job Card Fields
    "theoreticalEfficiency" JSONB,
    "qualityTargets" JSONB,
    "shiftAssignments" JSONB DEFAULT '[]',
    "initialUtilityReadings" JSONB,
    "finalUtilityReadings" JSONB,
    "hourlyUtilityReadings" JSONB DEFAULT '[]',
    "hourlyEfficiency" JSONB DEFAULT '[]',
    "overallEfficiency" DECIMAL(5, 2) CHECK ("overallEfficiency" >= 0 AND "overallEfficiency" <= 100),
    "totalDowntime" INTEGER DEFAULT 0 CHECK ("totalDowntime" >= 0),
    "qualityScore" DECIMAL(5, 2) CHECK ("qualityScore" >= 0 AND "qualityScore" <= 100),
    "costPerUnit" DECIMAL(10, 4) CHECK ("costPerUnit" >= 0),
    "processParameters" JSONB DEFAULT '{}',
    "qualityControlData" JSONB DEFAULT '{}',
    
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_machines_machine_id ON machines("machineId");
CREATE INDEX IF NOT EXISTS idx_machines_type ON machines(type);
CREATE INDEX IF NOT EXISTS idx_machines_status ON machines(status);

CREATE INDEX IF NOT EXISTS idx_production_jobs_job_id ON production_jobs("jobId");
CREATE INDEX IF NOT EXISTS idx_production_jobs_status ON production_jobs(status);
CREATE INDEX IF NOT EXISTS idx_production_jobs_priority ON production_jobs(priority);
CREATE INDEX IF NOT EXISTS idx_production_jobs_machine_id ON production_jobs("machineId");
CREATE INDEX IF NOT EXISTS idx_production_jobs_worker_id ON production_jobs("workerId");
CREATE INDEX IF NOT EXISTS idx_production_jobs_due_date ON production_jobs("dueDate");
CREATE INDEX IF NOT EXISTS idx_production_jobs_created_at ON production_jobs("createdAt");

-- Insert Sample Machines
INSERT INTO machines ("machineId", name, type, status, capacity, location, specifications) 
VALUES 
    ('M001', 'Dyeing Machine 1', 'dyeing', 'active', 500.00, 'Floor 1', '{"maxTemp": 130, "capacity": "500kg"}'),
    ('M002', 'Dyeing Machine 2', 'dyeing', 'active', 750.00, 'Floor 1', '{"maxTemp": 130, "capacity": "750kg"}'),
    ('M003', 'Spinning Machine 1', 'spinning', 'active', 1000.00, 'Floor 2', '{"speed": "1800rpm", "capacity": "1000kg"}'),
    ('M004', 'Weaving Machine 1', 'weaving', 'active', 300.00, 'Floor 3', '{"width": "150cm", "capacity": "300kg"}'),
    ('M005', 'Finishing Machine 1', 'finishing', 'active', 400.00, 'Floor 4', '{"speed": "50m/min", "capacity": "400kg"}')
ON CONFLICT ("machineId") DO NOTHING;

-- Ensure Users table exists (minimal structure)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Ensure Costings table exists
CREATE TABLE IF NOT EXISTS "Costings" (
    id SERIAL PRIMARY KEY,
    "workOrderId" INTEGER,
    "materialCost" DECIMAL(10, 2) NOT NULL DEFAULT 0,
    "laborCost" DECIMAL(10, 2) NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(10, 2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Update sequences to ensure proper auto-increment
SELECT setval('machines_id_seq', COALESCE((SELECT MAX(id) FROM machines), 1));
SELECT setval('production_jobs_id_seq', COALESCE((SELECT MAX(id) FROM production_jobs), 1));
SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1));
SELECT setval('"Costings_id_seq"', COALESCE((SELECT MAX(id) FROM "Costings"), 1));

-- Add foreign key constraints if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'production_jobs_machineId_fkey'
    ) THEN
        ALTER TABLE production_jobs 
        ADD CONSTRAINT production_jobs_machineId_fkey 
        FOREIGN KEY ("machineId") REFERENCES machines(id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'production_jobs_workerId_fkey'
    ) THEN
        ALTER TABLE production_jobs 
        ADD CONSTRAINT production_jobs_workerId_fkey 
        FOREIGN KEY ("workerId") REFERENCES users(id);
    END IF;
END $$;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

COMMIT;
