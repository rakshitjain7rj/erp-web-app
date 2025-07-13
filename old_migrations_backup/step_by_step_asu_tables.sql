-- Step-by-Step ASU Tables Creation for Neon PostgreSQL
-- Run these commands ONE BY ONE in your Neon SQL Editor

-- STEP 1: Check if any ASU tables already exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'asu_%';

-- STEP 2: Create Daily Machine Data Table
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

-- STEP 3: Verify Daily Machine Data table was created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'asu_daily_machine_data';

-- STEP 4: Create Production Efficiency Table
CREATE TABLE IF NOT EXISTS asu_production_efficiency (
    id SERIAL PRIMARY KEY,
    machine INTEGER NOT NULL CHECK (machine >= 1 AND machine <= 21),
    kgs_produced DECIMAL(10,2) NOT NULL DEFAULT 0,
    machine_hours_working DECIMAL(4,1) NOT NULL DEFAULT 0 CHECK (machine_hours_working >= 0 AND machine_hours_working <= 24),
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- STEP 5: Verify Production Efficiency table was created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'asu_production_efficiency';

-- STEP 6: Create Mains Readings Table
CREATE TABLE IF NOT EXISTS asu_mains_readings (
    id SERIAL PRIMARY KEY,
    reading_8am DECIMAL(10,2) NOT NULL DEFAULT 0,
    reading_8pm DECIMAL(10,2) NOT NULL DEFAULT 0,
    date DATE NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- STEP 7: Verify Mains Readings table was created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'asu_mains_readings';

-- STEP 8: Create Weekly Data Table
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

-- STEP 9: Verify Weekly Data table was created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'asu_weekly_data';

-- STEP 10: Verify ALL tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'asu_%'
ORDER BY table_name;
