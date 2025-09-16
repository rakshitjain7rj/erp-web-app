-- Moved from project root: asu_production_entries_enhanced.sql
-- Purpose: Create asu_production_entries with unit support and constraints

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

CREATE INDEX IF NOT EXISTS idx_asu_production_entries_date_unit_machine 
ON asu_production_entries (date, unit, machine_number);

CREATE INDEX IF NOT EXISTS idx_asu_production_entries_unit ON asu_production_entries (unit);
CREATE INDEX IF NOT EXISTS idx_asu_production_entries_date ON asu_production_entries (date);
CREATE INDEX IF NOT EXISTS idx_asu_production_entries_shift ON asu_production_entries (shift);
CREATE INDEX IF NOT EXISTS idx_asu_production_entries_machine_number ON asu_production_entries (machine_number);

DO $$
BEGIN
    BEGIN
        ALTER TABLE asu_production_entries 
        ADD CONSTRAINT unique_unit_machine_date_shift 
        UNIQUE (unit, machine_number, date, shift);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$ LANGUAGE plpgsql;
