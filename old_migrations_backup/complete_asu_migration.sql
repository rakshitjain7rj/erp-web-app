-- Complete ASU Unit 1 & 2 Migration Script
-- Run this script in your Neon SQL Editor

-- =============================================================================
-- 1. Create ASU Machines Table
-- =============================================================================

CREATE TABLE asu_machines (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    machine_no INTEGER NOT NULL UNIQUE,
    count INTEGER NOT NULL DEFAULT 0,
    spindles INTEGER NOT NULL DEFAULT 0,
    speed NUMERIC(10, 2) NOT NULL DEFAULT 0,
    production_at_100 NUMERIC(10, 2) NOT NULL DEFAULT 0,
    unit INTEGER NOT NULL DEFAULT 1 CHECK (unit IN (1, 2)),
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
-- 3. Insert Sample Data
-- =============================================================================

-- Insert sample machines for Unit 1
INSERT INTO asu_machines (machine_no, count, spindles, speed, production_at_100, unit, is_active) VALUES 
    (1, 20, 240, 18000.00, 120.00, 1, true),
    (2, 20, 240, 18000.00, 120.00, 1, true),
    (3, 20, 240, 18000.00, 120.00, 1, true),
    (4, 20, 240, 18000.00, 120.00, 1, true),
    (5, 20, 240, 18000.00, 120.00, 1, true);

-- Insert sample machines for Unit 2
INSERT INTO asu_machines (machine_no, count, spindles, speed, production_at_100, unit, is_active) VALUES 
    (10, 30, 360, 16000.00, 150.00, 2, true),
    (11, 30, 360, 16000.00, 150.00, 2, true),
    (12, 30, 360, 16000.00, 150.00, 2, true),
    (13, 30, 360, 16000.00, 150.00, 2, true),
    (14, 30, 360, 16000.00, 150.00, 2, true);

-- Insert sample production entries for testing
INSERT INTO asu_production_entries (
    unit, machine_number, date, shift, 
    actual_production, theoretical_production, efficiency, remarks
) VALUES 
    (1, 1, '2025-01-01', 'day', 85.50, 100.00, 85.50, 'Normal operation'),
    (1, 1, '2025-01-01', 'night', 78.25, 100.00, 78.25, 'Slight delay in start'),
    (1, 2, '2025-01-01', 'day', 92.75, 100.00, 92.75, 'Excellent performance'),
    (1, 2, '2025-01-01', 'night', 88.00, 100.00, 88.00, 'Regular operation'),
    (1, 3, '2025-01-01', 'day', 91.50, 100.00, 91.50, 'Smooth operation'),
    (2, 10, '2025-01-01', 'day', 88.00, 100.00, 88.00, 'Regular maintenance done'),
    (2, 10, '2025-01-01', 'night', 91.50, 100.00, 91.50, 'Smooth operation'),
    (2, 11, '2025-01-01', 'day', 94.25, 100.00, 94.25, 'Excellent efficiency');

-- =============================================================================
-- 4. Grant Permissions (Optional - adjust as needed)
-- =============================================================================

-- GRANT ALL PRIVILEGES ON TABLE asu_machines TO your_app_user;
-- GRANT ALL PRIVILEGES ON SEQUENCE asu_machines_id_seq TO your_app_user;
-- GRANT ALL PRIVILEGES ON TABLE asu_production_entries TO your_app_user;
-- GRANT ALL PRIVILEGES ON SEQUENCE asu_production_entries_id_seq TO your_app_user;

-- =============================================================================
-- Migration Complete!
-- =============================================================================
