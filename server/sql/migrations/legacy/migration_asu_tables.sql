-- Legacy: ASU Unit 2 tables migration (preserved)
-- Prefer structured and verified migrations under server/sql/migrations

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
CREATE TABLE IF NOT EXISTS asu_production_efficiency (
    id SERIAL PRIMARY KEY,
    machine INTEGER NOT NULL CHECK (machine >= 1 AND machine <= 21),
    kgs_produced DECIMAL(10,2) NOT NULL DEFAULT 0,
    machine_hours_working DECIMAL(4,1) NOT NULL DEFAULT 0 CHECK (machine_hours_working >= 0 AND machine_hours_working <= 24),
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS asu_mains_readings (
    id SERIAL PRIMARY KEY,
    reading_8am DECIMAL(10,2) NOT NULL DEFAULT 0,
    reading_8pm DECIMAL(10,2) NOT NULL DEFAULT 0,
    date DATE NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
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
-- Indexes omitted in legacy copy
