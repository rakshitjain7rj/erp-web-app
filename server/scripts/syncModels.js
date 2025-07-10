/**
 * Sequelize Model Sync Script
 * 
 * This script synchronizes the Sequelize model definitions with the database.
 * It applies changes to the database schema based on the current model definitions,
 * such as removing Unit 2 options and enforcing Unit 1 as default.
 * 
 * Note: The ASUProductionEntry model maps 'machineNumber' in JS to 'machine_no' in the database,
 * not 'machine_number'. SQL queries should use 'machine_no'.
 * 
 * Usage: node syncModels.js
 */

require('dotenv').config();
const { sequelize } = require('../../server/config/postgres');
const ASUMachine = require('../../server/models/ASUMachine');
const ASUProductionEntry = require('../../server/models/ASUProductionEntry');

async function syncModels() {
  try {
    console.log('🔄 Starting model synchronization...');
    
    // Authenticate with the database
    await sequelize.authenticate();
    console.log('✅ Database connection established.');
    
    // Synchronize individual models
    console.log('\n📊 Synchronizing ASU Machine model...');
    await ASUMachine.sync({ alter: true });
    console.log('✅ ASU Machine model synchronized.');
    
    console.log('\n📊 Synchronizing ASU Production Entry model...');
    await ASUProductionEntry.sync({ alter: true });
    console.log('✅ ASU Production Entry model synchronized.');

    // Verify unit values
    console.log('\n🔍 Verifying unit values in the database...');
    
    // Update all records in asu_machines to ensure unit=1
    const machinesUpdated = await sequelize.query(`
      UPDATE asu_machines 
      SET unit = 1 
      WHERE unit != 1
    `);
    console.log(`✅ Updated ${machinesUpdated[1]} machine records to unit=1.`);
    
    // Update all records in asu_production_entries to ensure unit=1
    const entriesUpdated = await sequelize.query(`
      UPDATE asu_production_entries 
      SET unit = 1 
      WHERE unit != 1
    `);
    console.log(`✅ Updated ${entriesUpdated[1]} production entries to unit=1.`);
    
    console.log('\n✅ All models synchronized successfully!');
    console.log('✅ Unit values verified and updated if needed.');
    console.log('✅ ASU Unit 1 is now the only supported unit in the system.');
    
  } catch (error) {
    console.error('❌ Error synchronizing models:', error);
  } finally {
    await sequelize.close();
    console.log('\n👋 Database connection closed.');
  }
}

syncModels();
