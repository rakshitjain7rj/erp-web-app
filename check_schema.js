// Check actual database schema
const { Pool } = require('pg');

const pool = new Pool({
  user: 'neondb_owner',
  host: 'ep-old-snow-a85chxyu-pooler.eastus2.azure.neon.tech',
  database: 'neondb',
  password: 'npg_J0IkBnaKcHS6',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
  try {
    console.log('🔍 Checking actual database schema...');
    
    // Check if tables exist
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('DyeingFirms', 'CountProducts')
    `);
    
    console.log('📊 Existing tables:', tables.rows.map(r => r.table_name));
    
    // Check DyeingFirms columns
    if (tables.rows.some(t => t.table_name === 'DyeingFirms')) {
      const dyeingColumns = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'DyeingFirms' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      
      console.log('\n📋 DyeingFirms columns:');
      dyeingColumns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable ? 'nullable' : 'not null'})`);
      });
    }
    
    // Check CountProducts columns
    if (tables.rows.some(t => t.table_name === 'CountProducts')) {
      const countColumns = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'CountProducts' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      
      console.log('\n📋 CountProducts columns:');
      countColumns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable ? 'nullable' : 'not null'})`);
      });
    }
    
    // Check data in tables
    try {
      const firmCount = await pool.query('SELECT COUNT(*) FROM "DyeingFirms"');
      console.log(`\n📊 DyeingFirms records: ${firmCount.rows[0].count}`);
      
      const productCount = await pool.query('SELECT COUNT(*) FROM "CountProducts"');
      console.log(`📦 CountProducts records: ${productCount.rows[0].count}`);
    } catch (error) {
      console.log('⚠️ Could not count records:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Schema check error:', error.message);
  } finally {
    await pool.end();
  }
}

checkSchema();
