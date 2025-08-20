require('dotenv').config();
const { Sequelize } = require('sequelize');

async function verifyDatabase() {
  try {
    const sequelize = new Sequelize(process.env.POSTGRES_URI, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
      logging: false,
    });

    await sequelize.authenticate();
    console.log('✅ Database connection successful\n');

    // 1. Check if ASU tables exist
    console.log('=== Checking ASU Tables ===');
    const tables = await sequelize.query(`
      SELECT table_name, table_schema
      FROM information_schema.tables 
      WHERE table_name IN ('asu_machines', 'asu_production_entries')
      AND table_schema = 'public'
    `);
    
    console.log('Found tables:');
    tables[0].forEach(t => console.log(`- ${t.table_name} (schema: ${t.table_schema})`));
    
    // 2. Check asu_production_entries structure if it exists
    if (tables[0].some(t => t.table_name === 'asu_production_entries')) {
      console.log('\n=== ASU Production Entries Columns ===');
      const columns = await sequelize.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'asu_production_entries' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      
      columns[0].forEach(col => {
        console.log(`- ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable}, default: ${col.column_default || 'none'})`);
      });
      
      // 3. Check data counts
      console.log('\n=== Table Record Counts ===');
      const counts = await sequelize.query(`
        SELECT 'asu_machines' as table_name, COUNT(*) as record_count FROM asu_machines
        UNION ALL
        SELECT 'asu_production_entries' as table_name, COUNT(*) as record_count FROM asu_production_entries
      `);
      
      counts[0].forEach(count => {
        console.log(`- ${count.table_name}: ${count.record_count} records`);
      });
      
      // 4. Sample data preview
      console.log('\n=== Sample Production Entries ===');
      const sampleEntries = await sequelize.query(`
        SELECT * FROM asu_production_entries LIMIT 3
      `);
      
      if (sampleEntries[0].length > 0) {
        console.log(JSON.stringify(sampleEntries[0], null, 2));
      } else {
        console.log('No records found in asu_production_entries');
      }
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.error(error.stack);
  }
}

verifyDatabase();
