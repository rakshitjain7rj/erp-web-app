-- Production Management System Database Schema Migration
-- For Neon PostgreSQL Database
-- Run this script in your Neon SQL Editor

-- ========================================
-- 1. CREATE MACHINES TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS machines (
    id SERIAL PRIMARY KEY,
    "machineId" VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'other' 
        CHECK (type IN ('dyeing', 'spinning', 'weaving', 'finishing', 'other')),
    location VARCHAR(100),
    capacity DECIMAL(10, 2) CHECK (capacity >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'active' 
        CHECK (status IN ('active', 'maintenance', 'inactive')),
    specifications JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for machines table
CREATE INDEX IF NOT EXISTS idx_machines_machine_id ON machines("machineId");
CREATE INDEX IF NOT EXISTS idx_machines_type ON machines(type);
CREATE INDEX IF NOT EXISTS idx_machines_status ON machines(status);

-- ========================================
-- 2. ENSURE USERS TABLE EXISTS
-- ========================================

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

-- ========================================
-- 3. CREATE PRODUCTION JOBS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS production_jobs (
    id SERIAL PRIMARY KEY,
    "jobId" VARCHAR(50) UNIQUE NOT NULL,
    "productType" VARCHAR(100) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL CHECK (quantity >= 0.01),
    unit VARCHAR(20) NOT NULL DEFAULT 'kg',
    "machineId" INTEGER NOT NULL,
    "workerId" INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' 
        CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    "startDate" TIMESTAMP WITH TIME ZONE,
    "endDate" TIMESTAMP WITH TIME ZONE,
    "dueDate" TIMESTAMP WITH TIME ZONE,
    "estimatedHours" DECIMAL(8, 2) CHECK ("estimatedHours" >= 0),
    "actualHours" DECIMAL(8, 2) CHECK ("actualHours" >= 0),
    "partyName" VARCHAR(100),
    "dyeingOrderId" INTEGER,
    notes TEXT,
    
    -- Detailed Job Card Fields (JSONB for flexibility)
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

-- Create indexes for production_jobs table
CREATE INDEX IF NOT EXISTS idx_production_jobs_job_id ON production_jobs("jobId");
CREATE INDEX IF NOT EXISTS idx_production_jobs_status ON production_jobs(status);
CREATE INDEX IF NOT EXISTS idx_production_jobs_priority ON production_jobs(priority);
CREATE INDEX IF NOT EXISTS idx_production_jobs_machine_id ON production_jobs("machineId");
CREATE INDEX IF NOT EXISTS idx_production_jobs_worker_id ON production_jobs("workerId");
CREATE INDEX IF NOT EXISTS idx_production_jobs_due_date ON production_jobs("dueDate");
CREATE INDEX IF NOT EXISTS idx_production_jobs_created_at ON production_jobs("createdAt");
CREATE INDEX IF NOT EXISTS idx_production_jobs_party_name ON production_jobs("partyName");

-- ========================================
-- 4. CREATE COSTINGS TABLE (IF NEEDED)
-- ========================================

CREATE TABLE IF NOT EXISTS "Costings" (
    id SERIAL PRIMARY KEY,
    "workOrderId" INTEGER,
    "materialCost" DECIMAL(10, 2) NOT NULL DEFAULT 0,
    "laborCost" DECIMAL(10, 2) NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(10, 2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ========================================
-- 5. ADD FOREIGN KEY CONSTRAINTS
-- ========================================

-- Add foreign key constraint for production_jobs -> machines
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'production_jobs_machineId_fkey'
    ) THEN
        ALTER TABLE production_jobs 
        ADD CONSTRAINT production_jobs_machineId_fkey 
        FOREIGN KEY ("machineId") REFERENCES machines(id) ON DELETE RESTRICT;
    END IF;
END $$;

-- Add foreign key constraint for production_jobs -> users
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'production_jobs_workerId_fkey'
    ) THEN
        ALTER TABLE production_jobs 
        ADD CONSTRAINT production_jobs_workerId_fkey 
        FOREIGN KEY ("workerId") REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ========================================
-- 6. INSERT SAMPLE DATA
-- ========================================

-- Insert sample machines
INSERT INTO machines ("machineId", name, type, status, capacity, location, specifications) 
VALUES 
    ('DYE001', 'Dyeing Machine Alpha', 'dyeing', 'active', 500.00, 'Floor 1 - Section A', '{"maxTemp": 130, "capacity": "500kg", "manufacturer": "TextileTech"}'),
    ('DYE002', 'Dyeing Machine Beta', 'dyeing', 'active', 750.00, 'Floor 1 - Section B', '{"maxTemp": 130, "capacity": "750kg", "manufacturer": "TextileTech"}'),
    ('SPIN001', 'Spinning Machine Gamma', 'spinning', 'active', 1000.00, 'Floor 2 - Section A', '{"speed": "1800rpm", "capacity": "1000kg", "spindles": 240}'),
    ('WEAVE001', 'Weaving Machine Delta', 'weaving', 'active', 300.00, 'Floor 3 - Section A', '{"width": "150cm", "capacity": "300kg", "looms": 8}'),
    ('FINISH001', 'Finishing Machine Epsilon', 'finishing', 'active', 400.00, 'Floor 4 - Section A', '{"speed": "50m/min", "capacity": "400kg", "width": "180cm"}'),
    ('DYE003', 'Dyeing Machine Zeta', 'dyeing', 'maintenance', 600.00, 'Floor 1 - Section C', '{"maxTemp": 140, "capacity": "600kg", "manufacturer": "IndustrialDye"}')
ON CONFLICT ("machineId") DO NOTHING;

-- Insert sample user (for testing)
INSERT INTO users (email, password, name, role, "isActive")
VALUES 
    ('admin@example.com', '$2a$10$example_hash', 'System Administrator', 'admin', true),
    ('operator1@example.com', '$2a$10$example_hash', 'Machine Operator 1', 'operator', true),
    ('supervisor1@example.com', '$2a$10$example_hash', 'Production Supervisor', 'supervisor', true)
ON CONFLICT (email) DO NOTHING;

-- ========================================
-- 7. UPDATE SEQUENCES (ENSURE PROPER AUTO-INCREMENT)
-- ========================================

-- Update sequences to ensure proper auto-increment values
SELECT setval('machines_id_seq', COALESCE((SELECT MAX(id) FROM machines), 1));
SELECT setval('production_jobs_id_seq', COALESCE((SELECT MAX(id) FROM production_jobs), 1));
SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1));
SELECT setval('"Costings_id_seq"', COALESCE((SELECT MAX(id) FROM "Costings"), 1));

-- ========================================
-- 8. CREATE HELPER FUNCTIONS (OPTIONAL)
-- ========================================

-- Function to generate next job ID
CREATE OR REPLACE FUNCTION generate_job_id()
RETURNS TEXT AS $$
DECLARE
    prefix TEXT;
    next_num INTEGER;
    result TEXT;
BEGIN
    -- Generate prefix based on current date (PJ + YYYYMM)
    prefix := 'PJ' || TO_CHAR(NOW(), 'YYYYMM');
    
    -- Find the highest existing number for this month
    SELECT COALESCE(
        MAX(CAST(SUBSTRING("jobId" FROM LENGTH(prefix) + 1) AS INTEGER)), 
        0
    ) INTO next_num
    FROM production_jobs 
    WHERE "jobId" LIKE prefix || '%';
    
    -- Increment and format
    next_num := next_num + 1;
    result := prefix || LPAD(next_num::TEXT, 4, '0');
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 9. CREATE VIEWS FOR REPORTING (OPTIONAL)
-- ========================================

-- View for production job summary
CREATE OR REPLACE VIEW production_job_summary AS
SELECT 
    pj.id,
    pj."jobId",
    pj."productType",
    pj.quantity,
    pj.unit,
    pj.status,
    pj.priority,
    pj."startDate",
    pj."endDate",
    pj."dueDate",
    pj."partyName",
    pj."overallEfficiency",
    pj."totalDowntime",
    pj."qualityScore",
    m.name as machine_name,
    m.type as machine_type,
    u.name as worker_name,
    CASE 
        WHEN pj."endDate" IS NOT NULL AND pj."startDate" IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (pj."endDate" - pj."startDate")) / 3600
        ELSE NULL 
    END as actual_duration_hours,
    CASE 
        WHEN pj."dueDate" < NOW() AND pj.status NOT IN ('completed', 'cancelled')
        THEN true 
        ELSE false 
    END as is_overdue
FROM production_jobs pj
LEFT JOIN machines m ON pj."machineId" = m.id
LEFT JOIN users u ON pj."workerId" = u.id;

-- ========================================
-- 10. VERIFICATION QUERIES
-- ========================================

-- Verify tables were created successfully
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('machines', 'production_jobs', 'users', 'Costings')
ORDER BY table_name;

-- Verify sample data was inserted
SELECT 'Machines' as table_name, COUNT(*) as record_count FROM machines
UNION ALL
SELECT 'Users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'Production Jobs' as table_name, COUNT(*) as record_count FROM production_jobs
UNION ALL
SELECT 'Costings' as table_name, COUNT(*) as record_count FROM "Costings";

-- Show machine details
SELECT 
    "machineId", 
    name, 
    type, 
    status, 
    capacity, 
    location 
FROM machines 
ORDER BY type, name;

-- ========================================
-- MIGRATION COMPLETE
-- ========================================

-- Success message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PRODUCTION MANAGEMENT SYSTEM MIGRATION COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables created: machines, production_jobs, users, Costings';
    RAISE NOTICE 'Sample data inserted: % machines, % users', 
        (SELECT COUNT(*) FROM machines),
        (SELECT COUNT(*) FROM users);
    RAISE NOTICE 'Foreign keys and indexes created successfully';
    RAISE NOTICE 'Helper functions and views created';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'You can now start your Node.js backend server!';
    RAISE NOTICE '========================================';
END $$;
