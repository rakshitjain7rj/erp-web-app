const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkYarnTypeColumn() {
  try {
    console.log('Checking database connection...');
    
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'asu_production_entries';
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('❌ Table asu_production_entries does not exist');
      return;
    }
    
    console.log('✅ Table asu_production_entries exists');
    
    // Check table structure
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'asu_production_entries'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nTable structure:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Check specifically for yarn_type column
    const hasYarnType = result.rows.find(row => row.column_name === 'yarn_type');
    if (hasYarnType) {
      console.log('\n✅ yarn_type column EXISTS!');
      console.log(`yarn_type: ${hasYarnType.data_type} (${hasYarnType.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      
      // Check if there are any entries with yarn_type
      const countResult = await pool.query('SELECT COUNT(*) as count FROM asu_production_entries WHERE yarn_type IS NOT NULL');
      console.log(`Entries with yarn_type: ${countResult.rows[0].count}`);
      
    } else {
      console.log('\n❌ yarn_type column does NOT exist');
      console.log('Need to add the column to the database');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkYarnTypeColumn();
