-- Moved from project root: add_machine_configurations_table.sql
-- Purpose: Create machine_configurations table and supporting triggers/indexes

CREATE TABLE IF NOT EXISTS machine_configurations (
  id SERIAL PRIMARY KEY,
  machine_id INTEGER NOT NULL,
  spindle_count INTEGER,
  yarn_type VARCHAR(255) NOT NULL DEFAULT 'Cotton',
  production_at_100 DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  saved_at TIMESTAMP WITH TIME ZONE NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NULL
);

CREATE INDEX IF NOT EXISTS idx_machine_configurations_machine_id ON machine_configurations(machine_id);
CREATE INDEX IF NOT EXISTS idx_machine_configurations_dates ON machine_configurations(start_date, end_date);
