-- ASU Unit 2 Tables Migration
-- Run this script to create ASU Unit 2 tracking tables

-- Daily Machine Data
CREATE TABLE IF NOT EXISTS asu_daily_machine_data (
    id SERIAL PRIMARY KEY,
    machine INTEGER NOT NULL CHECK (machine >= 1 AND machine <= 21),
    karigar_name VARCHAR(255) NOT NULL,
    reading_8am DECIMAL(10,2) NOT NULL DEFAULT 0,
    reading_8pm DECIMAL(10,2) NOT NULL DEFAULT 0,
    machine_hours_worked DECIMAL(4,1) NOT NULL DEFAULT 0 CHECK (machine_hours_worked >= 0 AND machine_hours_worked <= 24),
    yarn VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Production Efficiency Data
CREATE TABLE IF NOT EXISTS asu_production_efficiency (
    id SERIAL PRIMARY KEY,
    machine INTEGER NOT NULL CHECK (machine >= 1 AND machine <= 21),
    kgs_produced DECIMAL(10,2) NOT NULL DEFAULT 0,
    machine_hours_working DECIMAL(4,1) NOT NULL DEFAULT 0 CHECK (machine_hours_working >= 0 AND machine_hours_working <= 24),
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Mains Readings (Daily)
CREATE TABLE IF NOT EXISTS asu_mains_readings (
    id SERIAL PRIMARY KEY,
    reading_8am DECIMAL(10,2) NOT NULL DEFAULT 0,
    reading_8pm DECIMAL(10,2) NOT NULL DEFAULT 0,
    date DATE NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Weekly Data
CREATE TABLE IF NOT EXISTS asu_weekly_data (
    id SERIAL PRIMARY KEY,
    machine INTEGER NOT NULL CHECK (machine >= 1 AND machine <= 21),
    number_of_threads INTEGER NOT NULL DEFAULT 0,
    ten_min_weight DECIMAL(8,2) NOT NULL DEFAULT 0,
    ideal_12hr DECIMAL(10,2) NOT NULL DEFAULT 0,
    ideal_85_percent DECIMAL(10,2) NOT NULL DEFAULT 0,
    speed DECIMAL(8,2) NOT NULL DEFAULT 0,
    week_start_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_asu_daily_machine_date ON asu_daily_machine_data(date);
CREATE INDEX IF NOT EXISTS idx_asu_daily_machine_machine_date ON asu_daily_machine_data(machine, date);
CREATE INDEX IF NOT EXISTS idx_asu_daily_machine_karigar ON asu_daily_machine_data(karigar_name);

CREATE INDEX IF NOT EXISTS idx_asu_production_date ON asu_production_efficiency(date);
CREATE INDEX IF NOT EXISTS idx_asu_production_machine_date ON asu_production_efficiency(machine, date);

CREATE INDEX IF NOT EXISTS idx_asu_mains_date ON asu_mains_readings(date);

CREATE INDEX IF NOT EXISTS idx_asu_weekly_week_start ON asu_weekly_data(week_start_date);
CREATE INDEX IF NOT EXISTS idx_asu_weekly_machine_week ON asu_weekly_data(machine, week_start_date);

-- Insert sample data for testing
INSERT INTO asu_daily_machine_data (machine, karigar_name, reading_8am, reading_8pm, machine_hours_worked, yarn, date) VALUES
(1, 'Ramesh Kumar', 1200.50, 1350.75, 12.0, 'Cotton 30s', CURRENT_DATE),
(2, 'Suresh Patel', 980.25, 1125.80, 11.5, 'Polyester 150D', CURRENT_DATE),
(3, 'Mahesh Singh', 1100.00, 1245.30, 12.0, 'Cotton 20s', CURRENT_DATE)
ON CONFLICT DO NOTHING;

INSERT INTO asu_production_efficiency (machine, kgs_produced, machine_hours_working, date) VALUES
(1, 145.50, 12.0, CURRENT_DATE),
(2, 125.75, 11.5, CURRENT_DATE),
(3, 155.25, 12.0, CURRENT_DATE)
ON CONFLICT DO NOTHING;

INSERT INTO asu_mains_readings (reading_8am, reading_8pm, date) VALUES
(15750.25, 16125.80, CURRENT_DATE)
ON CONFLICT (date) DO NOTHING;

INSERT INTO asu_weekly_data (machine, number_of_threads, ten_min_weight, ideal_12hr, ideal_85_percent, speed, week_start_date) VALUES
(1, 240, 85.5, 6156.0, 5232.6, 1800.0, DATE_TRUNC('week', CURRENT_DATE)),
(2, 200, 78.2, 5630.4, 4785.84, 1750.0, DATE_TRUNC('week', CURRENT_DATE)),
(3, 280, 92.8, 6681.6, 5679.36, 1850.0, DATE_TRUNC('week', CURRENT_DATE))
ON CONFLICT DO NOTHING;

-- Add update triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_asu_daily_machine_data_updated_at ON asu_daily_machine_data;
CREATE TRIGGER update_asu_daily_machine_data_updated_at 
    BEFORE UPDATE ON asu_daily_machine_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_asu_production_efficiency_updated_at ON asu_production_efficiency;
CREATE TRIGGER update_asu_production_efficiency_updated_at 
    BEFORE UPDATE ON asu_production_efficiency 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_asu_mains_readings_updated_at ON asu_mains_readings;
CREATE TRIGGER update_asu_mains_readings_updated_at 
    BEFORE UPDATE ON asu_mains_readings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_asu_weekly_data_updated_at ON asu_weekly_data;
CREATE TRIGGER update_asu_weekly_data_updated_at 
    BEFORE UPDATE ON asu_weekly_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
