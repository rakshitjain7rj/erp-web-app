// Moved from root: run_archive_fields_migration.js
// Purpose: Run inventory fields SQL migration

const { execSync } = require('child_process');

function run() {
  const file = require('path').resolve(__dirname, '../../sql/migrations/add_inventory_fields.sql');
  console.log('Applying migration:', file);
  try {
    const conn = process.env.POSTGRES_URI || process.env.POSTGRES_URL;
    if (!conn) {
      console.error('Missing POSTGRES_URI (or POSTGRES_URL) environment variable for migrations');
      process.exit(1);
    }
    execSync(`psql "${conn}" -f "${file}"`, { stdio: 'inherit' });
    console.log('Migration applied successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

run();
