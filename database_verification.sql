-- Database verification script
-- Run this to check your current database state

-- 1. Check all tables
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Check Users table structure and data
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
