const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const INIT_NODE_ENV = process.env.NODE_ENV || 'development';
const envFileSpecificEarly = path.resolve(__dirname, `../.env.${INIT_NODE_ENV}`);
const envFileDefaultEarly = path.resolve(__dirname, '../.env');

if (require('fs').existsSync(envFileSpecificEarly)) {
    dotenv.config({ path: envFileSpecificEarly });
    console.log(`Loaded ${envFileSpecificEarly}`);
} else if (require('fs').existsSync(envFileDefaultEarly)) {
    dotenv.config({ path: envFileDefaultEarly });
    console.log(`Loaded ${envFileDefaultEarly}`);
}

const { sequelize } = require('../config/postgres');

async function forceFixConstraints() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const sql = `
BEGIN;

-- 1. Explicitly drop the known problematic constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'asu_machines_machine_no_key98'
  ) THEN
    ALTER TABLE public.asu_machines DROP CONSTRAINT asu_machines_machine_no_key98;
    RAISE NOTICE 'Dropped specific constraint: asu_machines_machine_no_key98';
  END IF;
END $$;

-- 2. Drop ANY unique constraint on machine_no (single column)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'asu_machines'
      AND c.contype = 'u'  -- unique constraint
      AND array_length(c.conkey, 1) = 1 -- single column
      AND (
        SELECT attname FROM pg_attribute 
        WHERE attrelid = t.oid AND attnum = c.conkey[1]
      ) = 'machine_no'
  ) LOOP
    EXECUTE format('ALTER TABLE public.asu_machines DROP CONSTRAINT %I', r.conname);
    RAISE NOTICE 'Dropped generic unique constraint: %', r.conname;
  END LOOP;
END $$;

-- 3. Drop ANY unique index on machine_no (single column)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT i.indexrelid::regclass::text AS index_name
    FROM pg_index i
    JOIN pg_class ic ON ic.oid = i.indexrelid
    JOIN pg_class tc ON tc.oid = i.indrelid
    JOIN pg_namespace n ON n.oid = tc.relnamespace
    WHERE n.nspname = 'public'
      AND tc.relname = 'asu_machines'
      AND i.indisunique = true -- unique index
      AND i.indnatts = 1       -- single column
      AND NOT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conindid = i.indexrelid) -- not associated with a constraint (handled above)
      AND EXISTS (
        SELECT 1 FROM pg_attribute a 
        WHERE a.attrelid = tc.oid AND a.attnum = ANY(i.indkey) AND a.attname = 'machine_no'
      )
  ) LOOP
    EXECUTE 'DROP INDEX IF EXISTS ' || r.index_name;
    RAISE NOTICE 'Dropped generic unique index: %', r.index_name;
  END LOOP;
END $$;

-- 4. Ensure the correct composite unique constraint exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'asu_machines'
      AND c.contype = 'u'
      AND c.conname = 'unique_unit_machine_no'
  ) THEN
    ALTER TABLE public.asu_machines ADD CONSTRAINT unique_unit_machine_no UNIQUE (unit, machine_no);
    RAISE NOTICE 'Added correct composite constraint: unique_unit_machine_no';
  ELSE
    RAISE NOTICE 'Composite constraint unique_unit_machine_no already exists';
  END IF;
END $$;

COMMIT;
`;

        await sequelize.query(sql);
        console.log('✅ Successfully forced fix for ASU machine constraints.');

    } catch (error) {
        console.error('❌ Error fixing constraints:', error);
    } finally {
        await sequelize.close();
    }
}

forceFixConstraints();
