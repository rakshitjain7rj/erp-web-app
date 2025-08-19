-- Legacy: ASU Machines table (original version). Prefer server/sql/migrations/asu_machines.sql

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
CREATE INDEX idx_asu_machines_unit ON asu_machines (unit);
CREATE INDEX idx_asu_machines_machine_no ON asu_machines (machine_no);
CREATE INDEX idx_asu_machines_active ON asu_machines (is_active);
ALTER TABLE asu_machines ADD CONSTRAINT unique_machine_no_per_unit UNIQUE (machine_no, unit);
CREATE OR REPLACE FUNCTION update_asu_machines_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = CURRENT_TIMESTAMP; RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_update_asu_machines_updated_at BEFORE UPDATE ON asu_machines FOR EACH ROW EXECUTE FUNCTION update_asu_machines_updated_at();
-- Sample inserts omitted
