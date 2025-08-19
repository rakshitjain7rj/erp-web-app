// Moved from root: run_migration.js
// Purpose: Apply core ASU migrations

const { execSync } = require('child_process');
const path = require('path');

function apply(file) {
  const abs = path.resolve(__dirname, '../../sql/migrations', file);
  console.log('Applying:', abs);
  execSync(`psql "$POSTGRES_URL" -f "${abs}"`, { stdio: 'inherit' });
}

try {
  apply('asu_machines.sql');
  apply('asu_production_entries.sql');
  console.log('All migrations applied.');
} catch (e) {
  console.error('Migration failed:', e.message);
  process.exit(1);
}
