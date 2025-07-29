/**
 * Script to run the migration to add archive fields to ASU machines
 */
const { Sequelize } = require('sequelize');
const { sequelize } = require('./server/config/postgres');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

console.log('Running migration to add archive fields to ASU machines...');

// Path to migration file
const migrationPath = path.join(__dirname, 'server', 'migrations', 'add_archive_fields_to_machines.js');

// Check if migration file exists
if (!fs.existsSync(migrationPath)) {
  console.error('Migration file not found:', migrationPath);
  process.exit(1);
}

// Run migration using sequelize-cli
const command = `npx sequelize-cli db:migrate --migrations-path=./server/migrations --config=./server/config/postgres.js`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error running migration: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Migration error: ${stderr}`);
    return;
  }
  console.log(`Migration successful: ${stdout}`);
  console.log('Archive fields have been added to ASU machines table.');
});
