const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:g7o9B53gJgMd@ep-old-snow-a85chxyu-pooler.eastus2.azure.neon.tech/neondb?sslmode=require'
});

async function checkDyeingTables() {
  try {
    console.log('🔍 Checking for dyeing-related tables...');
    
    // Check for DyeingRecords (plural - what Sequelize would create)
    const dyeingRecordsCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'DyeingRecords' 
      ORDER BY ordinal_position;
    `);
    
    if (dyeingRecordsCheck.rows.length > 0) {
      console.log('✅ DyeingRecords table exists with columns:');
      dyeingRecordsCheck.rows.forEach(row => {
        console.log('  -', row.column_name, '(' + row.data_type + ')');
      });
    } else {
      console.log('❌ DyeingRecords table does not exist!');
    }
    
    // Check for any dyeing-related tables
    const dyeingTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name ILIKE '%dyeing%' AND table_schema = 'public'
    `);
    
    console.log('🔍 All tables with "dyeing" in name:', dyeingTables.rows.map(r => r.table_name));
    
    // Check all public tables
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('📋 All public tables:', allTables.rows.map(r => r.table_name));
    
    await pool.end();
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    await pool.end();
  }
}

checkDyeingTables();
