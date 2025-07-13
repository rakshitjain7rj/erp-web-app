-- Safe ASU Unit 1 & 2 Migration Script
-- This script checks for existing tables and handles conflicts
-- Run this script in your Neon SQL Editor

-- =============================================================================
-- 1. Drop existing tables if they exist (BE CAREFUL - THIS WILL DELETE DATA)
-- =============================================================================

-- Uncomment these lines ONLY if you want to start fresh and delete existing data
-- DROP TABLE IF EXISTS asu_production_entries CASCADE;
-- DROP TABLE IF EXISTS asu_machines CASCADE;

-- =============================================================================
-- 2. Create ASU Machines Table (with IF NOT EXISTS)
-- =============================================================================

CREATE TABLE IF NOT EXISTS asu_machines (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    machine_no INTEGER NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    spindles INTEGER NOT NULL DEFAULT 0,
    speed NUMERIC(10, 2) NOT NULL DEFAULT 0,
    production_at_100 NUMERIC(10, 2) NOT NULL DEFAULT 0,
    unit INTEGER NOT NULL DEFAULT 1 CHECK (unit IN (1, 2)),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_asu_machines_unit ON asu_machines (unit);
CREATE INDEX IF NOT EXISTS idx_asu_machines_machine_no ON asu_machines (machine_no);
CREATE INDEX IF NOT EXISTS idx_asu_machines_active ON asu_machines (is_active);

-- Add unique constraints if they don't exist
DO $$
BEGIN
    -- Try to add unique constraint for machine_no
    BEGIN
        ALTER TABLE asu_machines ADD CONSTRAINT unique_asu_machine_no UNIQUE (machine_no);
    EXCEPTION
        WHEN duplicate_table THEN
            -- Constraint already exists, do nothing
        WHEN duplicate_object THEN
            -- Constraint already exists, do nothing
    END;
    
    -- Try to add unique constraint for machine_no per unit
    BEGIN
        ALTER TABLE asu_machines ADD CONSTRAINT unique_machine_no_per_unit UNIQUE (machine_no, unit);
    EXCEPTION
        WHEN duplicate_table THEN
            -- Constraint already exists, do nothing
        WHEN duplicate_object THEN
            -- Constraint already exists, do nothing
    END;
END $$;

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_asu_machines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (drop if exists first)
DROP TRIGGER IF EXISTS trigger_update_asu_machines_updated_at ON asu_machines;
CREATE TRIGGER trigger_update_asu_machines_updated_at
    BEFORE UPDATE ON asu_machines
    FOR EACH ROW
    EXECUTE FUNCTION update_asu_machines_updated_at();

-- =============================================================================
-- 3. Create ASU Production Entries Table (with IF NOT EXISTS)
-- =============================================================================

CREATE TABLE IF NOT EXISTS asu_production_entries (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    unit INTEGER NOT NULL CHECK (unit IN (1, 2)),
    machine_number INTEGER NOT NULL,
    date DATE NOT NULL,
    shift VARCHAR(10) NOT NULL CHECK (shift IN ('day', 'night')),
    actual_production NUMERIC(10, 2),
    theoretical_production NUMERIC(10, 2),
    efficiency NUMERIC(5, 2),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_asu_production_entries_date_unit_machine 
ON asu_production_entries (date, unit, machine_number);

CREATE INDEX IF NOT EXISTS idx_asu_production_entries_unit ON asu_production_entries (unit);
CREATE INDEX IF NOT EXISTS idx_asu_production_entries_date ON asu_production_entries (date);
CREATE INDEX IF NOT EXISTS idx_asu_production_entries_shift ON asu_production_entries (shift);
CREATE INDEX IF NOT EXISTS idx_asu_production_entries_machine_number ON asu_production_entries (machine_number);

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
    BEGIN
        ALTER TABLE asu_production_entries 
        ADD CONSTRAINT unique_unit_machine_date_shift 
        UNIQUE (unit, machine_number, date, shift);
    EXCEPTION
        WHEN duplicate_table THEN
            -- Constraint already exists, do nothing
        WHEN duplicate_object THEN
            -- Constraint already exists, do nothing
    END;
END $$;

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_asu_production_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (drop if exists first)
DROP TRIGGER IF EXISTS trigger_update_asu_production_entries_updated_at ON asu_production_entries;
CREATE TRIGGER trigger_update_asu_production_entries_updated_at
    BEFORE UPDATE ON asu_production_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_asu_production_entries_updated_at();

-- =============================================================================
-- 4. Insert Sample Data (only if tables are empty)
-- =============================================================================

-- Insert sample machines for Unit 1 (only if no data exists)
INSERT INTO asu_machines (machine_no, count, spindles, speed, production_at_100, unit, is_active)
SELECT 1, 20, 240, 18000.00, 120.00, 1, true
WHERE NOT EXISTS (SELECT 1 FROM asu_machines WHERE machine_no = 1 AND unit = 1);

INSERT INTO asu_machines (machine_no, count, spindles, speed, production_at_100, unit, is_active)
SELECT 2, 20, 240, 18000.00, 120.00, 1, true
WHERE NOT EXISTS (SELECT 1 FROM asu_machines WHERE machine_no = 2 AND unit = 1);

INSERT INTO asu_machines (machine_no, count, spindles, speed, production_at_100, unit, is_active)
SELECT 3, 20, 240, 18000.00, 120.00, 1, true
WHERE NOT EXISTS (SELECT 1 FROM asu_machines WHERE machine_no = 3 AND unit = 1);

INSERT INTO asu_machines (machine_no, count, spindles, speed, production_at_100, unit, is_active)
SELECT 4, 20, 240, 18000.00, 120.00, 1, true
WHERE NOT EXISTS (SELECT 1 FROM asu_machines WHERE machine_no = 4 AND unit = 1);

INSERT INTO asu_machines (machine_no, count, spindles, speed, production_at_100, unit, is_active)
SELECT 5, 20, 240, 18000.00, 120.00, 1, true
WHERE NOT EXISTS (SELECT 1 FROM asu_machines WHERE machine_no = 5 AND unit = 1);

-- Insert sample machines for Unit 2 (only if no data exists)
INSERT INTO asu_machines (machine_no, count, spindles, speed, production_at_100, unit, is_active)
SELECT 10, 30, 360, 16000.00, 150.00, 2, true
WHERE NOT EXISTS (SELECT 1 FROM asu_machines WHERE machine_no = 10 AND unit = 2);

INSERT INTO asu_machines (machine_no, count, spindles, speed, production_at_100, unit, is_active)
SELECT 11, 30, 360, 16000.00, 150.00, 2, true
WHERE NOT EXISTS (SELECT 1 FROM asu_machines WHERE machine_no = 11 AND unit = 2);

INSERT INTO asu_machines (machine_no, count, spindles, speed, production_at_100, unit, is_active)
SELECT 12, 30, 360, 16000.00, 150.00, 2, true
WHERE NOT EXISTS (SELECT 1 FROM asu_machines WHERE machine_no = 12 AND unit = 2);

INSERT INTO asu_machines (machine_no, count, spindles, speed, production_at_100, unit, is_active)
SELECT 13, 30, 360, 16000.00, 150.00, 2, true
WHERE NOT EXISTS (SELECT 1 FROM asu_machines WHERE machine_no = 13 AND unit = 2);

INSERT INTO asu_machines (machine_no, count, spindles, speed, production_at_100, unit, is_active)
SELECT 14, 30, 360, 16000.00, 150.00, 2, true
WHERE NOT EXISTS (SELECT 1 FROM asu_machines WHERE machine_no = 14 AND unit = 2);

-- Insert sample production entries for testing (only if no data exists)
INSERT INTO asu_production_entries (unit, machine_number, date, shift, actual_production, theoretical_production, efficiency, remarks)
SELECT 1, 1, '2025-01-01', 'day', 85.50, 100.00, 85.50, 'Normal operation'
WHERE NOT EXISTS (SELECT 1 FROM asu_production_entries WHERE unit = 1 AND machine_number = 1 AND date = '2025-01-01' AND shift = 'day');

INSERT INTO asu_production_entries (unit, machine_number, date, shift, actual_production, theoretical_production, efficiency, remarks)
SELECT 1, 1, '2025-01-01', 'night', 78.25, 100.00, 78.25, 'Slight delay in start'
WHERE NOT EXISTS (SELECT 1 FROM asu_production_entries WHERE unit = 1 AND machine_number = 1 AND date = '2025-01-01' AND shift = 'night');

INSERT INTO asu_production_entries (unit, machine_number, date, shift, actual_production, theoretical_production, efficiency, remarks)
SELECT 1, 2, '2025-01-01', 'day', 92.75, 100.00, 92.75, 'Excellent performance'
WHERE NOT EXISTS (SELECT 1 FROM asu_production_entries WHERE unit = 1 AND machine_number = 2 AND date = '2025-01-01' AND shift = 'day');

INSERT INTO asu_production_entries (unit, machine_number, date, shift, actual_production, theoretical_production, efficiency, remarks)
SELECT 1, 2, '2025-01-01', 'night', 88.00, 100.00, 88.00, 'Regular operation'
WHERE NOT EXISTS (SELECT 1 FROM asu_production_entries WHERE unit = 1 AND machine_number = 2 AND date = '2025-01-01' AND shift = 'night');

INSERT INTO asu_production_entries (unit, machine_number, date, shift, actual_production, theoretical_production, efficiency, remarks)
SELECT 1, 3, '2025-01-01', 'day', 91.50, 100.00, 91.50, 'Smooth operation'
WHERE NOT EXISTS (SELECT 1 FROM asu_production_entries WHERE unit = 1 AND machine_number = 3 AND date = '2025-01-01' AND shift = 'day');

INSERT INTO asu_production_entries (unit, machine_number, date, shift, actual_production, theoretical_production, efficiency, remarks)
SELECT 2, 10, '2025-01-01', 'day', 88.00, 100.00, 88.00, 'Regular maintenance done'
WHERE NOT EXISTS (SELECT 1 FROM asu_production_entries WHERE unit = 2 AND machine_number = 10 AND date = '2025-01-01' AND shift = 'day');

INSERT INTO asu_production_entries (unit, machine_number, date, shift, actual_production, theoretical_production, efficiency, remarks)
SELECT 2, 10, '2025-01-01', 'night', 91.50, 100.00, 91.50, 'Smooth operation'
WHERE NOT EXISTS (SELECT 1 FROM asu_production_entries WHERE unit = 2 AND machine_number = 10 AND date = '2025-01-01' AND shift = 'night');

INSERT INTO asu_production_entries (unit, machine_number, date, shift, actual_production, theoretical_production, efficiency, remarks)
SELECT 2, 11, '2025-01-01', 'day', 94.25, 100.00, 94.25, 'Excellent efficiency'
WHERE NOT EXISTS (SELECT 1 FROM asu_production_entries WHERE unit = 2 AND machine_number = 11 AND date = '2025-01-01' AND shift = 'day');

-- =============================================================================
-- 5. Verification Queries
-- =============================================================================

-- Check if tables were created successfully
SELECT 'asu_machines' as table_name, COUNT(*) as record_count FROM asu_machines
UNION ALL
SELECT 'asu_production_entries' as table_name, COUNT(*) as record_count FROM asu_production_entries;

-- =============================================================================
-- Migration Complete!
-- =============================================================================
