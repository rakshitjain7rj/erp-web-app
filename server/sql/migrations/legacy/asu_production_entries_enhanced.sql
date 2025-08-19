-- Legacy: ASU Production Entries (enhanced) schema
-- Preserved for historical reference. Prefer using server/sql/migrations/asu_production_entries.sql

-- PostgreSQL 15+ compatible SQL for ASU Production Entries table
-- This table tracks production for ASU Units 1 and 2

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
CREATE INDEX idx_asu_production_entries_date_unit_machine ON asu_production_entries (date, unit, machine_number);
CREATE INDEX idx_asu_production_entries_unit ON asu_production_entries (unit);
CREATE INDEX idx_asu_production_entries_date ON asu_production_entries (date);
CREATE INDEX idx_asu_production_entries_shift ON asu_production_entries (shift);
ALTER TABLE asu_production_entries ADD CONSTRAINT unique_unit_machine_date_shift UNIQUE (unit, machine_number, date, shift);
CREATE OR REPLACE FUNCTION update_asu_production_entries_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = CURRENT_TIMESTAMP; RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_update_asu_production_entries_updated_at BEFORE UPDATE ON asu_production_entries FOR EACH ROW EXECUTE FUNCTION update_asu_production_entries_updated_at();
-- Sample data omitted in legacy copy
