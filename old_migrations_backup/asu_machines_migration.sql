-- Create ASU Machines table for Unit 1 and 2
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

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON TABLE asu_machines TO your_app_user;
-- GRANT ALL PRIVILEGES ON SEQUENCE asu_machines_id_seq TO your_app_user;
