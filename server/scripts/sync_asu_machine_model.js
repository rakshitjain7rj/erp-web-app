// Script to sync ASU models with the database
require('dotenv').config();
const { sequelize } = require('../config/postgres');
const ASUMachine = require('../models/ASUMachine');
const fs = require('fs');
const path = require('path');

async function syncModels() {
  try {
    console.log('Starting ASU model synchronization...');
    
    // Sync the model with the database
    // Use alter: true to make changes to existing tables
    await ASUMachine.sync({ alter: true });
    
    console.log('Model synchronization complete.');
    
    // Also run the SQL migration script
    const migrationScript = fs.readFileSync(
      path.join(__dirname, '..', 'migrations', '20250709_add_yarntype_column.sql'),
      'utf8'
    );
    
    await sequelize.query(migrationScript);
    console.log('Migration script executed successfully.');
    
    console.log('Checking database schema...');
    const [results] = await sequelize.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'asu_machines'
      ORDER BY ordinal_position;
    `);
    
    console.log('ASU Machine table schema:');
    console.table(results);
    
    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error synchronizing models:', error);
    process.exit(1);
  }
}

syncModels();
