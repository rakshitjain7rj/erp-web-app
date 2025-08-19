// Run the per-unit uniqueness migration for asu_machines
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function run() {
  const uri = process.env.POSTGRES_URI || process.env.DATABASE_URL;
  if (!uri) {
    console.error('POSTGRES_URI/DATABASE_URL not set');
    process.exit(1);
  }

  const sequelize = new Sequelize(uri, {
    dialect: 'postgres',
    dialectOptions: uri.includes('neon.tech') ? { ssl: { require: true, rejectUnauthorized: false } } : {},
    logging: console.log,
  });

  try {
    console.log('Connecting to DB...');
    await sequelize.authenticate();
    console.log('Connected.');

    const sqlPath = path.join(__dirname, 'server', 'migrations', '20250819_unique_unit_machine_no.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('Applying migration 20250819_unique_unit_machine_no.sql...');
    await sequelize.query(sql);
    console.log('Migration applied successfully.');
  } catch (e) {
    console.error('Migration failed:', e.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

run();
