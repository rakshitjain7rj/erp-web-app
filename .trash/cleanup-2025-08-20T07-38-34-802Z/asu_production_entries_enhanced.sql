-- PostgreSQL 15+ compatible SQL for ASU Production Entries table
-- This table tracks production for ASU Units 1 and 2

-- Create the main table
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

-- Insert sample data for testing (optional)
INSERT INTO asu_production_entries (
    unit, machine_number, date, shift, 
    actual_production, theoretical_production, efficiency, remarks
) VALUES 
    (1, 1, '2025-01-01', 'day', 85.50, 100.00, 85.50, 'Normal operation'),
    (1, 1, '2025-01-01', 'night', 78.25, 100.00, 78.25, 'Slight delay in start'),
    (1, 2, '2025-01-01', 'day', 92.75, 100.00, 92.75, 'Excellent performance'),
    (2, 10, '2025-01-01', 'day', 88.00, 100.00, 88.00, 'Regular maintenance done'),
    (2, 10, '2025-01-01', 'night', 91.50, 100.00, 91.50, 'Smooth operation');

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON TABLE asu_production_entries TO your_app_user;
-- GRANT ALL PRIVILEGES ON SEQUENCE asu_production_entries_id_seq TO your_app_user;
