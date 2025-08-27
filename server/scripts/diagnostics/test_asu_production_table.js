const { sequelize } = require('../config/postgres');
const ASUProductionEntry = require('../models/ASUProductionEntry');
const { QueryTypes } = require('sequelize');

async function testAsuProductionTable() {
  try {
    console.log('🔗 Testing PostgreSQL connection...');
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection successful');

    // Check if table exists using raw SQL
    console.log('\n🔍 Checking if asu_production_entries table exists...');
    const tables = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'asu_production_entries'
    `, { type: QueryTypes.SELECT });

    if (tables.length === 0) {
      console.log('❌ Table asu_production_entries does not exist!');
      return;
    }
    console.log('✅ Table exists');

    // Check table columns using raw SQL
    console.log('\n🔍 Checking asu_production_entries columns...');
    const columns = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'asu_production_entries'
      ORDER BY ordinal_position
    `, { type: QueryTypes.SELECT });

    console.log('Table columns:');
    columns.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });

    // Try to query using Sequelize model 
    try {
      console.log('\n🔍 Testing Sequelize model...');
      const count = await ASUProductionEntry.count();
      console.log(`✅ Sequelize model count: ${count}`);
    } catch (error) {
      console.error('❌ Sequelize model error:', error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

testAsuProductionTable();
