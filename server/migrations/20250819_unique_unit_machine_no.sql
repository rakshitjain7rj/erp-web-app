-- Ensure per-unit uniqueness for ASU machines and clean up old global unique constraints
-- Safe to run multiple times

BEGIN;

-- 1) Drop ANY single-column unique constraint on machine_no (regardless of name)
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
      AND c.contype = 'u' -- unique constraints
      AND array_length(c.conkey, 1) = 1 -- single column
      AND (
        SELECT attname 
        FROM pg_attribute 
        WHERE attrelid = t.oid AND attnum = c.conkey[1]
      ) = 'machine_no'
  ) LOOP
    EXECUTE format('ALTER TABLE public.asu_machines DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

-- 2) Drop ANY standalone unique index on machine_no (not tied to a constraint)
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
      AND NOT EXISTS (
        SELECT 1 FROM pg_constraint c WHERE c.conindid = i.indexrelid
      )
      AND EXISTS (
        SELECT 1 
        FROM pg_attribute a 
        WHERE a.attrelid = tc.oid 
          AND a.attnum = ANY(i.indkey) 
          AND a.attname = 'machine_no'
      )
  ) LOOP
    EXECUTE 'DROP INDEX IF EXISTS ' || r.index_name;
  END LOOP;
END $$;

-- 3) Create composite unique constraint on (unit, machine_no) if missing
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
    ALTER TABLE public.asu_machines
      ADD CONSTRAINT unique_unit_machine_no UNIQUE (unit, machine_no);
  END IF;
END $$;

-- 4) Helpful index on unit for faster filters
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'idx_asu_machines_unit'
  ) THEN
    CREATE INDEX idx_asu_machines_unit ON public.asu_machines(unit);
  END IF;
END $$;

COMMIT;
