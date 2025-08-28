const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:g7o9B53gJgMd@ep-old-snow-a85chxyu-pooler.eastus2.azure.neon.tech/neondb?sslmode=require'
});

async function checkDyeingTable() {
  try {
    console.log('🔍 Checking if DyeingRecord table exists...');
    
    const tableCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'DyeingRecord' 
      ORDER BY ordinal_position;
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('❌ DyeingRecord table does not exist!');
      
      // Check for similar table names
      const similarTables = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name ILIKE '%dyeing%'
      `);
      
      console.log('🔍 Tables with "dyeing" in name:', similarTables.rows);
      
      // Check for any tables at all
      const allTables = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `);
      
      console.log('📋 All public tables:', allTables.rows.map(r => r.table_name));
      
    } else {
      console.log('✅ DyeingRecord table exists with columns:');
      tableCheck.rows.forEach(row => {
        console.log('  -', row.column_name, '(' + row.data_type + ')');
      });
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    await pool.end();
  }
}

checkDyeingTable();
