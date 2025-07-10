require('dotenv').config();
const { sequelize } = require('../config/postgres');
const fs = require('fs');
const path = require('path');

async function runSqlMigration() {
  try {
    console.log('Starting SQL migration to add yarn_type column to asu_machines table...');
    
    // Read the SQL migration file
    const sqlFilePath = path.join(__dirname, '..', 'migrations', '20250709_add_yarntype_column.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL migration
    await sequelize.query(sql);
    console.log('Migration SQL executed successfully.');
    
    // Verify the column
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'asu_machines'
      AND column_name IN ('yarn_type', 'count')
      ORDER BY ordinal_position;
    `);
    
    console.log('\nVerifying columns in asu_machines table:');
    console.table(results);
    
    // Log some sample data
    const [machines] = await sequelize.query(`
      SELECT id, machine_no, count, yarn_type 
      FROM asu_machines 
      LIMIT 5;
    `);
    
    console.log('\nSample data from asu_machines:');
    console.table(machines);
    
    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error running SQL migration:', error);
    process.exit(1);
  }
}

runSqlMigration();
