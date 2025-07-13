-- ASU Unit 1 Migration Script for Neon SQL Editor
-- This script creates the tables and constraints for ASU Unit 1 module

-- Create ASU Machines table
CREATE TABLE IF NOT EXISTS asu_machines (
    id SERIAL PRIMARY KEY,
    machine_no INTEGER NOT NULL UNIQUE,
    count INTEGER NOT NULL DEFAULT 0,
    spindles INTEGER NOT NULL DEFAULT 0,
    speed DECIMAL(10, 2) NOT NULL DEFAULT 0,
    production_at_100 DECIMAL(10, 2) NOT NULL DEFAULT 0,
    unit INTEGER NOT NULL DEFAULT 1 CHECK (unit IN (1, 2)),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create ASU Production Entries table
CREATE TABLE IF NOT EXISTS asu_production_entries (
    id SERIAL PRIMARY KEY,
    machine_id INTEGER NOT NULL REFERENCES asu_machines(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    day_shift DECIMAL(10, 2) NOT NULL DEFAULT 0,
    night_shift DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create unique constraint to prevent duplicate entries for same machine and date
ALTER TABLE asu_production_entries 
ADD CONSTRAINT unique_machine_date UNIQUE (machine_id, date);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_asu_machines_unit ON asu_machines(unit);
CREATE INDEX IF NOT EXISTS idx_asu_machines_active ON asu_machines(is_active);
CREATE INDEX IF NOT EXISTS idx_asu_production_entries_machine_id ON asu_production_entries(machine_id);
CREATE INDEX IF NOT EXISTS idx_asu_production_entries_date ON asu_production_entries(date);
CREATE INDEX IF NOT EXISTS idx_asu_production_entries_machine_date ON asu_production_entries(machine_id, date);

-- Insert sample ASU machines for Unit 1
INSERT INTO asu_machines (machine_no, count, spindles, speed, production_at_100, unit, is_active) 
VALUES 
    (1, 40, 1440, 12000, 86.4, 1, true),
    (2, 40, 1440, 12000, 86.4, 1, true),
    (3, 40, 1440, 12000, 86.4, 1, true),
    (4, 40, 1440, 12000, 86.4, 1, true),
    (5, 40, 1440, 12000, 86.4, 1, true)
ON CONFLICT (machine_no) DO NOTHING;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_asu_machines_updated_at 
    BEFORE UPDATE ON asu_machines 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asu_production_entries_updated_at 
    BEFORE UPDATE ON asu_production_entries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON TABLE asu_machines TO your_app_user;
-- GRANT ALL PRIVILEGES ON TABLE asu_production_entries TO your_app_user;
-- GRANT ALL PRIVILEGES ON SEQUENCE asu_machines_id_seq TO your_app_user;
-- GRANT ALL PRIVILEGES ON SEQUENCE asu_production_entries_id_seq TO your_app_user;
