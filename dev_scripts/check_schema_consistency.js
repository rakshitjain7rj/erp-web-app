/**
 * Schema Consistency Checker
 * 
 * This script compares the model definitions with the actual database schema
 * to identify inconsistencies that might be causing errors.
 */

const { sequelize } = require('../server/config/postgres');
const ASUMachine = require('../server/models/ASUMachine');
const ASUProductionEntry = require('../server/models/ASUProductionEntry');

async function checkSchemaConsistency() {
  try {
    console.log('🔍 Checking schema consistency...');
    
    // Get table information directly from database
    const [asuMachinesInfo] = await sequelize.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'asu_machines'
      ORDER BY ordinal_position;
    `);
    
    const [asuProductionEntriesInfo] = await sequelize.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'asu_production_entries'
      ORDER BY ordinal_position;
    `);

    console.log('\n📊 ASU Machines Table Structure:');
    console.table(asuMachinesInfo);
    
    console.log('\n📊 ASU Production Entries Table Structure:');
    console.table(asuProductionEntriesInfo);

    // Check for foreign keys
    const [foreignKeys] = await sequelize.query(`
      SELECT
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='asu_production_entries';
    `);

    console.log('\n🔗 Foreign Key Relationships:');
    console.table(foreignKeys);

    // Check indices
    const [asuMachineIndices] = await sequelize.query(`
      SELECT
        tablename,
        indexname,
        indexdef
      FROM
        pg_indexes
      WHERE
        tablename = 'asu_machines';
    `);

    const [asuProductionIndices] = await sequelize.query(`
      SELECT
        tablename,
        indexname,
        indexdef
      FROM
        pg_indexes
      WHERE
        tablename = 'asu_production_entries';
    `);

    console.log('\n📑 ASU Machines Indices:');
    console.table(asuMachineIndices);
    
    console.log('\n📑 ASU Production Entries Indices:');
    console.table(asuProductionIndices);

    // Check sequelize model attributes against DB columns
    console.log('\n🔄 Comparing Sequelize models with database schema:');
    
    const machineModelAttributes = Object.keys(ASUMachine.rawAttributes).map(key => ({
      fieldName: key,
      columnName: ASUMachine.rawAttributes[key].field || key
    }));
    
    const productionModelAttributes = Object.keys(ASUProductionEntry.rawAttributes).map(key => ({
      fieldName: key,
      columnName: ASUProductionEntry.rawAttributes[key].field || key
    }));
    
    console.log('\n🏭 ASU Machine Model vs DB mapping:');
    console.table(machineModelAttributes);
    
    console.log('\n📝 ASU Production Entry Model vs DB mapping:');
    console.table(productionModelAttributes);

    // Verify machine_no is used consistently
    console.log('\n✅ Checking for machine_id vs machine_no consistency:');
    
    const hasMachineIdColumn = asuProductionEntriesInfo.some(col => col.column_name === 'machine_id');
    const hasMachineNoColumn = asuProductionEntriesInfo.some(col => col.column_name === 'machine_no');
    
    console.log(`Production entries has machine_id column: ${hasMachineIdColumn ? '✓ YES' : '✗ NO'}`);
    console.log(`Production entries has machine_no column: ${hasMachineNoColumn ? '✓ YES' : '✗ NO'}`);

  } catch (error) {
    console.error('❌ Error checking schema consistency:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the check
checkSchemaConsistency().then(() => {
  console.log('✅ Schema consistency check complete');
});
