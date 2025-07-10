require('dotenv').config();
const path = require('path');
const { Sequelize } = require('sequelize');
const migration = require('../migrations/20250709_add_yarntype_count_columns');

async function runMigration() {
  try {
    console.log('Starting migration to add yarn_type and count columns to asu_machines table...');
    
    // Create Sequelize instance using environment variables
    const sequelize = new Sequelize(process.env.POSTGRES_URI, {
      dialect: 'postgres',
      logging: console.log
    });
    
    // Test the connection
    await sequelize.authenticate();
    console.log('Connection to database has been established successfully.');
    
    // Run the migration
    await migration.up(sequelize.getQueryInterface(), Sequelize);
    
    console.log('Migration completed successfully.');
    
    // Verify the columns
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'asu_machines'
      AND column_name IN ('yarn_type', 'count')
      ORDER BY ordinal_position;
    `);
    
    console.log('\nVerifying columns in asu_machines table:');
    console.table(results);
    
    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

runMigration();
