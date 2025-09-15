// Diagnostic runner for check_asu_tables.sql
const { execSync } = require('child_process');
const path = require('path');

(function run() {
  const file = path.resolve(__dirname, '../../sql/diagnostics/check_asu_tables.sql');
  console.log('Running diagnostic SQL:', file);
  try {
    const conn = process.env.POSTGRES_URI || process.env.POSTGRES_URL;
    if (!conn) {
      console.error('Missing POSTGRES_URI (or POSTGRES_URL) environment variable for diagnostic');
      process.exit(1);
    }
    execSync(`psql "${conn}" -f "${file}"`, { stdio: 'inherit' });
    console.log('Diagnostic executed successfully.');
  } catch (err) {
    console.error('Diagnostic failed:', err.message);
    process.exit(1);
  }
})();
