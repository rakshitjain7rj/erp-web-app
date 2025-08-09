 frontend
  yarn_type VARCHAR(255) NOT NULL DEFAULT 'Cotton',
  production_at_100 DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- Changed from efficiency_at_100_percent to match frontend
  is_active BOOLEAN NOT NULL DEFAULT TRUE, -- Added to match frontend
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  saved_at TIMESTAMP WITH TIME ZONE NULL, -- For tracking when the configuration was saved
  -- Optional start/end dates for tracking active periods
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NULL,
  CONSTRAINT unique_active_config CHECK (end_date IS NOT NULL OR (
    SELECT COUNT(*) FROM machine_configurations mc2 
    WHERE mc2.machine_id = machine_id AND mc2.end_date IS NULL
  ) <= 1)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_machine_configurations_machine_id ON machine_configurations(machine_id);
CREATE INDEX IF NOT EXISTS idx_machine_configurations_dates ON machine_configurations(start_date, end_date);

-- Create a function to check if date ranges overlap
CREATE OR REPLACE FUNCTION check_machine_config_dates() RETURNS TRIGGER AS $$
BEGIN
  -- Check for overlapping date ranges for the same machine
  IF EXISTS (
    SELECT 1 FROM machine_configurations
    WHERE machine_id = NEW.machine_id
    AND id != NEW.id
    AND (
      (NEW.start_date BETWEEN start_date AND COALESCE(end_date, '9999-12-31'::DATE))
      OR (COALESCE(NEW.end_date, '9999-12-31'::DATE) BETWEEN start_date AND COALESCE(end_date, '9999-12-31'::DATE))
      OR (start_date BETWEEN NEW.start_date AND COALESCE(NEW.end_date, '9999-12-31'::DATE))
    )
  ) THEN
    RAISE EXCEPTION 'Date ranges overlap for machine %', NEW.machine_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for overlapping date check
DROP TRIGGER IF EXISTS check_machine_config_dates_trigger ON machine_configurations;
CREATE TRIGGER check_machine_config_dates_trigger
BEFORE INSERT OR UPDATE ON machine_configurations
FOR EACH ROW EXECUTE FUNCTION check_machine_config_dates();

-- Function to migrate existing machine data to the configurations table
DO $$
DECLARE
  machine_record RECORD;
BEGIN
  -- For each machine, create an initial configuration
  FOR machine_record IN SELECT * FROM asu_machines
  LOOP
    -- Only insert if there isn't already a config for this machine
    IF NOT EXISTS (SELECT 1 FROM machine_configurations WHERE machine_id = machine_record.id) THEN
      INSERT INTO machine_configurations (
        machine_id, 
        spindle_count, 
        yarn_type, 
        efficiency_at_100_percent,
        start_date
      ) VALUES (
        machine_record.id,
        machine_record.spindles,
        machine_record.yarn_type,
        machine_record.production_at_100,
        machine_record.created_at::DATE
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
