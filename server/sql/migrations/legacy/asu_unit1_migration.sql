-- Legacy: ASU Unit 1 migration (Neon SQL editor flavor)
-- Prefer using structured migrations under server/sql/migrations

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
ALTER TABLE asu_production_entries ADD CONSTRAINT unique_machine_date UNIQUE (machine_id, date);
CREATE INDEX IF NOT EXISTS idx_asu_machines_unit ON asu_machines(unit);
CREATE INDEX IF NOT EXISTS idx_asu_machines_active ON asu_machines(is_active);
CREATE INDEX IF NOT EXISTS idx_asu_production_entries_machine_id ON asu_production_entries(machine_id);
CREATE INDEX IF NOT EXISTS idx_asu_production_entries_date ON asu_production_entries(date);
CREATE INDEX IF NOT EXISTS idx_asu_production_entries_machine_date ON asu_production_entries(machine_id, date);
-- Sample inserts omitted in legacy copy
