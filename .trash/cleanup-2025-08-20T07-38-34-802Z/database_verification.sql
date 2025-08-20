-- ASU Tables Verification Script
-- Run this in Neon SQL Editor to verify the migration worked

-- =============================================================================
-- 1. Check if ASU tables exist
-- =============================================================================
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name IN ('asu_machines', 'asu_production_entries')
AND table_schema = 'public';

-- =============================================================================
-- 2. Check table structures
-- =============================================================================

-- Check asu_machines structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'asu_machines' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check asu_production_entries structure  
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'asu_production_entries' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================================================
-- 3. Check data counts
-- =============================================================================
SELECT 'asu_machines' as table_name, COUNT(*) as record_count FROM asu_machines
UNION ALL
SELECT 'asu_production_entries' as table_name, COUNT(*) as record_count FROM asu_production_entries;

-- =============================================================================
-- 4. Sample data preview
-- =============================================================================

-- Preview asu_machines data
SELECT * FROM asu_machines ORDER BY unit, machine_no LIMIT 10;

-- Preview asu_production_entries data
SELECT * FROM asu_production_entries ORDER BY date DESC, unit, machine_number LIMIT 10;
SELECT * FROM information_schema.columns 
WHERE table_name = 'Users' 
ORDER BY ordinal_position;

SELECT id, name, email, role, "createdAt" FROM "Users" LIMIT 5;

-- 3. Check DyeingFollowUps table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'DyeingFollowUps' 
ORDER BY ordinal_position;

-- 4. Check DyeingRecords table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'DyeingRecords' 
ORDER BY ordinal_position;

-- 5. Check constraints
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name IN ('DyeingFollowUps', 'DyeingRecords', 'Users')
ORDER BY tc.table_name, tc.constraint_type;

-- 6. Sample data
SELECT 
    df.id,
    df."dyeingRecordId",
    df."followUpDate",
    df.remarks,
    df."addedBy",
    df."addedByName",
    df."createdAt"
FROM "DyeingFollowUps" df
LIMIT 5;
