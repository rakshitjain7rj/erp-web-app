const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.production.local') });

async function runMigration() {
  const config = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  };

  if (process.env.POSTGRES_URI) {
    config.connectionString = process.env.POSTGRES_URI;
    config.ssl = { rejectUnauthorized: false };
  } else if (process.env.POSTGRES_URL) {
    config.connectionString = process.env.POSTGRES_URL;
    config.ssl = { rejectUnauthorized: false };
  } else if (process.env.DATABASE_URL) {
    config.connectionString = process.env.DATABASE_URL;
    config.ssl = { rejectUnauthorized: false };
  }

  console.log('Connecting to database...');
  const client = new Client(config);

  try {
    await client.connect();
    console.log('Connected.');

    await client.query('BEGIN');

    // 1. Drop existing constraints if they exist
    console.log('Dropping old constraints/indexes...');

    // Attempt to drop unique constraint on machine_no (name might vary, so we try a few or ignore error)
    // Common names: asu_machines_machine_no_key, machine_no_unique, etc.
    // Query to find and drop unique constraints on strictly machine_no
    await client.query(`
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
            AND (SELECT attname FROM pg_attribute WHERE attrelid = t.oid AND attnum = c.conkey[1]) = 'machine_no'
        ) LOOP
          EXECUTE format('ALTER TABLE public.asu_machines DROP CONSTRAINT %I', r.conname);
        END LOOP;
      END $$;
    `);

    // Drop unique index if it exists (not constraint backed)
    await client.query(`
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
              AND (SELECT attname FROM pg_attribute WHERE attrelid = tc.oid AND attnum = i.indkey[0]) = 'machine_no'
        ) LOOP
            EXECUTE 'DROP INDEX IF EXISTS ' || r.index_name;
        END LOOP;
      END $$;
    `);


    // 2. Add composite unique constraint
    console.log('Adding composite unique constraint (unit, machine_no)...');
    try {
      await client.query('SAVEPOINT add_constraint');
      await client.query('ALTER TABLE public.asu_machines ADD CONSTRAINT unique_unit_machine_no UNIQUE (unit, machine_no);');
      console.log('Constraint created.');
    } catch (e) {
      if (e.code === '42P07') {
        await client.query('ROLLBACK TO SAVEPOINT add_constraint');
        console.log('Constraint unique_unit_machine_no already exists. Skipping.');
      } else {
        throw e;
      }
    }

    // 3. Verification
    console.log('Verifying constraints...');
    const res = await client.query(`
        SELECT conname, pg_get_constraintdef(c.oid) as def
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'asu_machines'
    `);
    console.log('Current constraints on asu_machines:', res.rows);


    await client.query('COMMIT');
    console.log('Migration completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

runMigration();
