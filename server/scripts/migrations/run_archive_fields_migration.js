// Moved from root: run_archive_fields_migration.js
// Purpose: Run inventory fields SQL migration

const { execSync } = require('child_process');

function run() {
  const file = require('path').resolve(__dirname, '../../sql/migrations/add_inventory_fields.sql');
  console.log('Applying migration:', file);
  try {
    execSync(`psql "$POSTGRES_URL" -f "${file}"`, { stdio: 'inherit' });
    console.log('Migration applied successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

run();
