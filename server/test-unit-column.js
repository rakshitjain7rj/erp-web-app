const { sequelize } = require('./config/postgres');
const ASUProductionEntry = require('./models/ASUProductionEntry');
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

    // Check if the 'unit' column exists
    const hasUnitColumn = columns.some(col => col.column_name === 'unit');
    if (!hasUnitColumn) {
      console.log('\n❌ The unit column is missing from the table!');
      
      // Check for a migration fix
      console.log('\n🔧 Checking if we can add the unit column...');
      await sequelize.query(`
        ALTER TABLE asu_production_entries 
        ADD COLUMN unit INTEGER NOT NULL DEFAULT 1 CHECK (unit IN (1, 2))
      `);
      console.log('✅ Added unit column to the table');
      
    } else {
      console.log('\n✅ The unit column exists');
    }

    // Try raw SQL count query that matches the failing query
    console.log('\n🔍 Testing raw SQL count query similar to the one in the error...');
    const [countResult] = await sequelize.query(`
      SELECT count(*) AS "count" 
      FROM "asu_production_entries"
      WHERE "asu_production_entries"."unit" = 1 
        AND "asu_production_entries"."date" = '2025-07-08'
    `, { type: QueryTypes.SELECT });
    
    console.log(`Count result: ${countResult.count}`);

    // Try to query using Sequelize model 
    try {
      console.log('\n🔍 Testing Sequelize model...');
      const count = await ASUProductionEntry.count({
        where: { unit: 1 }
      });
      console.log(`✅ Sequelize model count: ${count}`);
    } catch (error) {
      console.error('❌ Sequelize model error:', error.message);
      console.log('This suggests there is a mismatch between the Sequelize model and database schema.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

testAsuProductionTable();
