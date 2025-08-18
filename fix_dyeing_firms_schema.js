const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixDyeingFirmsSchema() {
  try {
    console.log('🔧 Fixing DyeingFirms table schema...');
    
    // Add missing columns
    await pool.query('ALTER TABLE "DyeingFirms" ADD COLUMN IF NOT EXISTS "phoneNumber" VARCHAR(20)');
    console.log('✅ Added phoneNumber column');
    
    await pool.query('ALTER TABLE "DyeingFirms" ADD COLUMN IF NOT EXISTS "email" VARCHAR(255)');
    console.log('✅ Added email column');
    
    await pool.query('ALTER TABLE "DyeingFirms" ADD COLUMN IF NOT EXISTS "address" TEXT');
    console.log('✅ Added address column');
    
    await pool.query('ALTER TABLE "DyeingFirms" ADD COLUMN IF NOT EXISTS "notes" TEXT');
    console.log('✅ Added notes column');
    
    // Verify table structure
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'DyeingFirms' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Current DyeingFirms table structure:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    console.log('🎉 Schema fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Schema fix failed:', error.message);
    console.error('❌ Full error:', error);
  } finally {
    await pool.end();
  }
}

fixDyeingFirmsSchema();
