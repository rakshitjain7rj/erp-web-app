const { sequelize } = require('./server/config/postgres');
const ASUProductionEntry = require('./server/models/ASUProductionEntry');
const { QueryTypes } = require('sequelize');

async function testAsuModels() {
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

    // Check if the 'unit' column exists
    const hasUnitColumn = columns.some(col => col.column_name === 'unit');
    if (!hasUnitColumn) {
      console.log('\n❌ The unit column is missing from the table!');
    } else {
      console.log('\n✅ The unit column exists');
    }

    // Try to query using Sequelize model (will show any mapping issues)
    try {
      console.log('\n🔍 Testing Sequelize model...');
      const entry = await ASUProductionEntry.findOne({
        where: { unit: 1 }
      });
      console.log('✅ Sequelize model test passed');
      if (entry) {
        console.log('Sample entry:', entry.toJSON());
      } else {
        console.log('No entries found');
      }
    } catch (error) {
      console.error('❌ Sequelize model error:', error.message);
      console.log('\nThis suggests there is a mismatch between the Sequelize model and database schema.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sequelize.close();
  }
}

testAsuModels();
