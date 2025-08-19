-- Moved from project root: asu_machines_migration.sql
-- Purpose: Create asu_machines with composite uniqueness

CREATE TABLE IF NOT EXISTS asu_machines (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    machine_no INTEGER NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    spindles INTEGER NOT NULL DEFAULT 0,
    speed NUMERIC(10, 2) NOT NULL DEFAULT 0,
    production_at_100 NUMERIC(10, 2) NOT NULL DEFAULT 0,
    unit INTEGER NOT NULL DEFAULT 1 CHECK (unit IN (1, 2)),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_asu_machines_unit ON asu_machines (unit);
CREATE INDEX IF NOT EXISTS idx_asu_machines_machine_no ON asu_machines (machine_no);
CREATE INDEX IF NOT EXISTS idx_asu_machines_active ON asu_machines (is_active);

DO $$
BEGIN
    BEGIN
        ALTER TABLE asu_machines 
        ADD CONSTRAINT unique_machine_no_per_unit 
        UNIQUE (machine_no, unit);
    EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
