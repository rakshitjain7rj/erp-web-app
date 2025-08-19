const fs = require('fs');
const { sequelize } = require('../../../config/postgres');
const { QueryTypes } = require('sequelize');

async function fixAsuTable() {
  try {
    console.log('🔗 Connecting to PostgreSQL...');
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection successful');

    console.log('\n🔍 Checking if asu_production_entries table exists...');
    const tables = await sequelize.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'asu_production_entries'`, { type: QueryTypes.SELECT });

    if (tables.length === 0) {
      console.log('❌ Table asu_production_entries does not exist!');
      console.log('Please run the complete ASU migration script first.');
      return;
    }
    console.log('✅ Table exists');

    console.log('\n🔍 Checking if unit column exists...');
    const columns = await sequelize.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'asu_production_entries' AND column_name = 'unit'`, { type: QueryTypes.SELECT });

    if (columns.length === 0) {
      console.log('❌ The unit column is missing - adding it now...');
      await sequelize.query(`
        ALTER TABLE asu_production_entries 
        ADD COLUMN unit INTEGER NOT NULL DEFAULT 1 CHECK (unit IN (1, 2))`);
      await sequelize.query(`CREATE INDEX idx_asu_production_entries_unit ON asu_production_entries(unit)`);
      console.log('✅ Added unit column to the table');
    } else {
      console.log('✅ unit column already exists');
    }

    console.log('\n🔍 Verifying table structure...');
    const updatedColumns = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'asu_production_entries'
      ORDER BY ordinal_position`, { type: QueryTypes.SELECT });

    console.log('Current table columns:');
    updatedColumns.forEach(col => console.log(`- ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`));

    console.log('\n🔍 Testing query that was failing...');
    try {
      const [countResult] = await sequelize.query(`
        SELECT count(*) AS "count" 
        FROM "asu_production_entries" AS "ASUProductionEntry" 
        WHERE "ASUProductionEntry"."unit" = 1 
        AND "ASUProductionEntry"."date" = '2025-07-08'`, { type: QueryTypes.SELECT });
      console.log(`✅ Query successful! Count: ${countResult.count}`);
    } catch (error) {
      console.error('❌ Query still fails:', error.message);
      console.error('Further debugging needed.');
    }

    console.log('\n✅ Finished fixing ASU production entries table');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

fixAsuTable();
