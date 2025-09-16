// Migration runner for add_machine_configurations_table.sql (previously invoked via psql directly)
const { execSync } = require('child_process');
const path = require('path');

(function run() {
  const file = path.resolve(__dirname, '../../sql/migrations/add_machine_configurations_table.sql');
  console.log('Applying machine config table migration:', file);
  try {
    const conn = process.env.POSTGRES_URI || process.env.POSTGRES_URL;
    if (!conn) {
      console.error('Missing POSTGRES_URI (or POSTGRES_URL) environment variable for migration');
      process.exit(1);
    }
    execSync(`psql "${conn}" -f "${file}"`, { stdio: 'inherit' });
    console.log('Machine configuration migration applied successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
})();
