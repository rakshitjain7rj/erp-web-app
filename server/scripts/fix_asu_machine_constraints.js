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

async function fixConstraints() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const sql = `
BEGIN;
-- Drop any single-column unique constraint on machine_no
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
      AND c.contype = 'u'
      AND array_length(c.conkey, 1) = 1
      AND (
        SELECT attname FROM pg_attribute 
        WHERE attrelid = t.oid AND attnum = c.conkey[1]
      ) = 'machine_no'
  ) LOOP
    EXECUTE format('ALTER TABLE public.asu_machines DROP CONSTRAINT %I', r.conname);
    RAISE NOTICE 'Dropped constraint: %', r.conname;
  END LOOP;
END $$;

-- Drop any standalone unique index on machine_no
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
      AND i.indisunique = true
      AND i.indnatts = 1
      AND NOT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conindid = i.indexrelid)
      AND EXISTS (
        SELECT 1 FROM pg_attribute a 
        WHERE a.attrelid = tc.oid AND a.attnum = ANY(i.indkey) AND a.attname = 'machine_no'
      )
  ) LOOP
    EXECUTE 'DROP INDEX IF EXISTS ' || r.index_name;
    RAISE NOTICE 'Dropped index: %', r.index_name;
  END LOOP;
END $$;

-- Add composite unique (unit, machine_no)
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
    RAISE NOTICE 'Added constraint: unique_unit_machine_no';
  END IF;
END $$;

COMMIT;
`;

        await sequelize.query(sql);
        console.log('✅ Successfully fixed ASU machine constraints.');

    } catch (error) {
        console.error('❌ Error fixing constraints:', error);
    } finally {
        await sequelize.close();
    }
}

fixConstraints();
