require('dotenv').config();
const { sequelize } = require('../config/postgres');

async function fixNumericOverflow() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    
    console.log('Altering columns to prevent numeric overflow...');

    // Fix mains_reading
    try {
      await sequelize.query('ALTER TABLE asu_production_entries ALTER COLUMN mains_reading TYPE DECIMAL(20, 2);');
      console.log('Updated mains_reading to DECIMAL(20, 2)');
    } catch (e) {
      console.log('Error updating mains_reading:', e);
    }

    // Fix efficiency
    try {
      await sequelize.query('ALTER TABLE asu_production_entries ALTER COLUMN efficiency TYPE DECIMAL(10, 2);');
      console.log('Updated efficiency to DECIMAL(10, 2)');
    } catch (e) {
      console.log('Error updating efficiency:', e);
    }

    // Fix actual_production
    try {
      await sequelize.query('ALTER TABLE asu_production_entries ALTER COLUMN actual_production TYPE DECIMAL(15, 2);');
      console.log('Updated actual_production to DECIMAL(15, 2)');
    } catch (e) {
      console.log('Error updating actual_production:', e);
    }

    console.log('Done fixing columns');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixNumericOverflow();
