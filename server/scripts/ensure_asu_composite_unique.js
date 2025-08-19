const { sequelize } = require('../config/postgres');

const SQL = `
BEGIN;

-- 1) Drop any FKs that reference public.asu_machines(machine_no) only
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT c.conname, c.conrelid::regclass::text AS referencing_table
    FROM pg_constraint c
    WHERE c.contype = 'f'
      AND c.confrelid = 'public.asu_machines'::regclass
      AND array_length(c.confkey, 1) = 1
      AND (
        SELECT attname 
        FROM pg_attribute 
        WHERE attrelid = c.confrelid AND attnum = c.confkey[1]
      ) = 'machine_no'
  ) LOOP
    RAISE NOTICE 'Dropping FK % on % because it references asu_machines(machine_no)', r.conname, r.referencing_table;
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.referencing_table, r.conname);
  END LOOP;
END $$;

-- 2) Drop any single-column unique constraint on machine_no
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
    RAISE NOTICE 'Dropping unique constraint % on asu_machines(machine_no)', r.conname;
    EXECUTE format('ALTER TABLE public.asu_machines DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

-- 3) Drop any standalone unique index on machine_no
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
    RAISE NOTICE 'Dropping unique index % on asu_machines(machine_no)', r.index_name;
    EXECUTE 'DROP INDEX IF EXISTS ' || r.index_name;
  END LOOP;
END $$;

-- 4) Add composite unique (unit, machine_no)
DO $$
BEGIN
  -- Drop stray index with the same name if constraint doesn't exist yet
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c WHERE c.conname = 'unique_unit_machine_no'
  ) AND EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'unique_unit_machine_no'
  ) THEN
    EXECUTE 'DROP INDEX IF EXISTS public.unique_unit_machine_no';
  END IF;

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
  END IF;
END $$;

-- 5) Helpful index on unit
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_asu_machines_unit') THEN
    CREATE INDEX idx_asu_machines_unit ON public.asu_machines(unit);
  END IF;
END $$;

-- 6) Recreate composite FK for asu_production_entries if applicable
DO $$
DECLARE col_name text;
BEGIN
  -- Determine whether the production entries table uses machine_no or machine_number
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'asu_production_entries' AND column_name = 'machine_no'
  ) THEN
    col_name := 'machine_no';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'asu_production_entries' AND column_name = 'machine_number'
  ) THEN
    col_name := 'machine_number';
  ELSE
    col_name := NULL;
  END IF;

  IF col_name IS NOT NULL AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'asu_production_entries' AND column_name = 'unit'
  ) THEN
    -- Drop any existing FK with our new name to be idempotent
    IF EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'fk_asu_production_entries_machine_unit'
    ) THEN
      EXECUTE 'ALTER TABLE public.asu_production_entries DROP CONSTRAINT fk_asu_production_entries_machine_unit';
    END IF;

    -- Create the composite FK (unit, machine_[no|number]) -> asu_machines(unit, machine_no)
    EXECUTE format(
      'ALTER TABLE public.asu_production_entries\n' ||
      'ADD CONSTRAINT fk_asu_production_entries_machine_unit\n' ||
      'FOREIGN KEY (unit, %I) REFERENCES public.asu_machines(unit, machine_no)\n' ||
      'ON UPDATE CASCADE ON DELETE RESTRICT',
      col_name
    );
  END IF;
END $$;

COMMIT;`;

async function run() {
  try {
    console.log('Applying per-unit unique fix for asu_machines...');
    await sequelize.query(SQL);
    console.log('Done.');
  } catch (e) {
    console.error('Failed to apply per-unit unique fix:', e.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

run();
