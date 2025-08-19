const { sequelize } = require('../../../config/postgres');
const ASUProductionEntry = require('../../../models/ASUProductionEntry');
const { QueryTypes } = require('sequelize');

async function testAsuModels() {
  try {
    console.log('🔗 Testing PostgreSQL connection...');
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection successful');

    console.log('\n🔍 Checking if asu_production_entries table exists...');
    const tables = await sequelize.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'asu_production_entries'`, { type: QueryTypes.SELECT });

    if (tables.length === 0) { console.log('❌ Table does not exist!'); return; }
    console.log('✅ Table exists');

    console.log('\n🔍 Checking asu_production_entries columns...');
    const columns = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'asu_production_entries'
      ORDER BY ordinal_position`, { type: QueryTypes.SELECT });

    console.log('Table columns:');
    columns.forEach(col => console.log(`- ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`));

    const hasUnitColumn = columns.some(col => col.column_name === 'unit');
    console.log(hasUnitColumn ? '\n✅ The unit column exists' : '\n❌ The unit column is missing!');

    try {
      console.log('\n🔍 Testing Sequelize model...');
      const entry = await ASUProductionEntry.findOne({ where: { unit: 1 } });
      console.log('✅ Sequelize model test passed');
      console.log(entry ? 'Sample entry: ' + JSON.stringify(entry.toJSON(), null, 2) : 'No entries found');
    } catch (error) {
      console.error('❌ Sequelize model error:', error.message);
      console.log('\nThis suggests a mismatch between the model and schema.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sequelize.close();
  }
}

testAsuModels();
