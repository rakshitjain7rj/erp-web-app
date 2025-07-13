-- ASU Unit 1 Complete Migration Script
-- This creates all necessary tables and initial data for ASU Unit 1 operations
-- Run this script to set up ASU functionality from scratch

-- =============================================================================
-- 1. Create ASU Machines Table
-- =============================================================================

-- Drop table if exists (for clean migration)
DROP TABLE IF EXISTS asu_production_entries CASCADE;
DROP TABLE IF EXISTS asu_machines CASCADE;
DROP FUNCTION IF EXISTS update_asu_machines_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_asu_production_entries_updated_at() CASCADE;

-- Create ASU Machines table
CREATE TABLE asu_machines (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    machine_no INTEGER NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    yarn_type VARCHAR(255) NOT NULL DEFAULT 'Cotton',
    spindles INTEGER NOT NULL DEFAULT 0,
    speed NUMERIC(10, 2) NOT NULL DEFAULT 0,
    production_at_100 NUMERIC(10, 2) NOT NULL DEFAULT 0,
    unit INTEGER NOT NULL DEFAULT 1 CHECK (unit IN (1)),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_asu_machines_unit ON asu_machines (unit);
CREATE INDEX idx_asu_machines_machine_no ON asu_machines (machine_no);
CREATE INDEX idx_asu_machines_active ON asu_machines (is_active);

-- Create unique constraint for machine number within unit
ALTER TABLE asu_machines 
ADD CONSTRAINT unique_machine_no_per_unit 
UNIQUE (machine_no, unit);

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_asu_machines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on row updates
CREATE TRIGGER trigger_update_asu_machines_updated_at
    BEFORE UPDATE ON asu_machines
    FOR EACH ROW
    EXECUTE FUNCTION update_asu_machines_updated_at();

-- =============================================================================
-- 2. Create ASU Production Entries Table
-- =============================================================================

CREATE TABLE asu_production_entries (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    unit INTEGER NOT NULL DEFAULT 1 CHECK (unit IN (1)),
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

-- Create index for optimized queries on date, unit, and machine_number
CREATE INDEX idx_asu_production_entries_date_unit_machine 
ON asu_production_entries (date, unit, machine_number);

-- Create additional useful indexes
CREATE INDEX idx_asu_production_entries_unit ON asu_production_entries (unit);
CREATE INDEX idx_asu_production_entries_date ON asu_production_entries (date);
CREATE INDEX idx_asu_production_entries_shift ON asu_production_entries (shift);
CREATE INDEX idx_asu_production_entries_machine_number ON asu_production_entries (machine_number);

-- Create unique constraint to prevent duplicate entries for same unit, machine, date, and shift
ALTER TABLE asu_production_entries 
ADD CONSTRAINT unique_unit_machine_date_shift 
UNIQUE (unit, machine_number, date, shift);

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_asu_production_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on row updates
CREATE TRIGGER trigger_update_asu_production_entries_updated_at
    BEFORE UPDATE ON asu_production_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_asu_production_entries_updated_at();

-- =============================================================================
-- 3. Insert Initial Machine Data for Unit 1
-- =============================================================================

-- Insert machines for Unit 1 (machines 1-9)
INSERT INTO asu_machines (machine_no, count, yarn_type, spindles, speed, production_at_100, unit, is_active) VALUES 
    (1, 20, 'Cotton', 240, 18000.00, 120.00, 1, true),
    (2, 20, 'Cotton', 240, 18000.00, 120.00, 1, true),
    (3, 20, 'Cotton', 240, 18000.00, 120.00, 1, true),
    (4, 20, 'Cotton', 240, 18000.00, 120.00, 1, true),
    (5, 20, 'Cotton', 240, 18000.00, 120.00, 1, true),
    (6, 20, 'Cotton', 240, 18000.00, 120.00, 1, true),
    (7, 20, 'Cotton', 240, 18000.00, 120.00, 1, true),
    (8, 20, 'Cotton', 240, 18000.00, 120.00, 1, true),
    (9, 20, 'Cotton', 240, 18000.00, 120.00, 1, true);

-- =============================================================================
-- 4. Verification Queries
-- =============================================================================

-- Verify machines table
SELECT 'ASU Machines Count' as check_type, COUNT(*) as count FROM asu_machines WHERE unit = 1;

-- Verify table structure
SELECT 'ASU Machines Columns' as check_type, column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'asu_machines' 
ORDER BY ordinal_position;

SELECT 'ASU Production Entries Columns' as check_type, column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'asu_production_entries' 
ORDER BY ordinal_position;

-- Display created machines
SELECT machine_no, count, yarn_type, production_at_100, is_active FROM asu_machines ORDER BY machine_no;
