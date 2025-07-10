/**
 * Database Column Verification Script
 * 
 * This script verifies the database schema to ensure that column names
 * match what's being used in the SQL queries.
 */

require('dotenv').config();
const { sequelize } = require('../config/postgres');
const { QueryTypes } = require('sequelize');

async function verifyDatabaseSchema() {
  try {
    console.log('🔍 Verifying database schema...');
    
    // Authenticate with the database
    await sequelize.authenticate();
    console.log('✅ Database connection established.');
    
    // Check table structure for asu_production_entries
    console.log('\n📊 Checking asu_production_entries table structure:');
    const productionColumns = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'asu_production_entries' 
      ORDER BY ordinal_position
    `, { type: QueryTypes.SELECT });
    
    console.log('Column Name | Data Type');
    console.log('------------------------');
    productionColumns.forEach(col => {
      console.log(`${col.column_name.padEnd(20)} | ${col.data_type}`);
    });
    
    // Check table structure for asu_machines
    console.log('\n📊 Checking asu_machines table structure:');
    const machineColumns = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'asu_machines' 
      ORDER BY ordinal_position
    `, { type: QueryTypes.SELECT });
    
    console.log('Column Name | Data Type');
    console.log('------------------------');
    machineColumns.forEach(col => {
      console.log(`${col.column_name.padEnd(20)} | ${col.data_type}`);
    });
    
    console.log('\n✅ Database schema verification complete.');
    
  } catch (error) {
    console.error('❌ Error verifying database schema:', error);
  } finally {
    await sequelize.close();
    console.log('\n👋 Database connection closed.');
  }
}

verifyDatabaseSchema();
