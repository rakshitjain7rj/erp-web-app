// Complete database table creation and migration script
const { Pool } = require('pg');

const pool = new Pool({
  user: 'neondb_owner',
  host: 'ep-old-snow-a85chxyu-pooler.eastus2.azure.neon.tech',
  database: 'neondb',
  password: 'npg_J0IkBnaKcHS6',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

async function createMissingTables() {
  try {
    console.log('🔧 Creating missing database tables...');
    
    // First, add missing columns to existing DyeingFirms table
    try {
      await pool.query(`ALTER TABLE "DyeingFirms" ADD COLUMN IF NOT EXISTS "contactPerson" VARCHAR(255) DEFAULT 'Manager'`);
      console.log('✅ Added contactPerson column to DyeingFirms');
    } catch (error) {
      console.log('📝 contactPerson column already exists or table needs to be created');
    }
    
    // Create DyeingFirms table with complete schema
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "DyeingFirms" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        "contactPerson" VARCHAR(255) DEFAULT 'Manager',
        "phoneNumber" VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        notes TEXT,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('✅ DyeingFirms table created/verified');

    // Add missing columns to CountProducts table  
    try {
      await pool.query(`ALTER TABLE "CountProducts" ADD COLUMN IF NOT EXISTS "yarnType" VARCHAR(255) DEFAULT 'Cotton'`);
      console.log('✅ Added yarnType column to CountProducts');
    } catch (error) {
      console.log('📝 yarnType column already exists or table needs to be created');
    }

    // Create CountProducts table with complete schema
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "CountProducts" (
        id SERIAL PRIMARY KEY,
        "dyeingFirm" VARCHAR(255) NOT NULL,
        "partyName" VARCHAR(255) NOT NULL,
        "yarnType" VARCHAR(255) DEFAULT 'Cotton',
        "yarnCount" VARCHAR(100),
        bags INTEGER DEFAULT 0,
        "totalWeight" DECIMAL(10,2) DEFAULT 0,
        remarks TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('✅ CountProducts table created/verified');

    // Remove hardcoded firms and add only user-driven firms
    console.log('🧹 Cleaning up hardcoded data...');
    
    // Check if there are any real user-created firms with products
    const realFirms = await pool.query(`
      SELECT DISTINCT df.name, df.id, COUNT(cp.id) as product_count
      FROM "DyeingFirms" df
      LEFT JOIN "CountProducts" cp ON df.name = cp."dyeingFirm"
      GROUP BY df.name, df.id
      HAVING COUNT(cp.id) > 0
    `);
    
    console.log(`📊 Found ${realFirms.rows.length} firms with actual products`);
    
    // Delete firms with 0 products (hardcoded firms)
    const deleteResult = await pool.query(`
      DELETE FROM "DyeingFirms" 
      WHERE id NOT IN (
        SELECT DISTINCT df.id
        FROM "DyeingFirms" df
        INNER JOIN "CountProducts" cp ON df.name = cp."dyeingFirm"
      )
    `);
    
    console.log(`🗑️ Removed ${deleteResult.rowCount} firms with 0 products`);

    // Show final counts
    const finalFirmCount = await pool.query('SELECT COUNT(*) FROM "DyeingFirms"');
    const finalProductCount = await pool.query('SELECT COUNT(*) FROM "CountProducts"');
    
    console.log('🎉 Database migration complete:');
    console.log(`   📊 DyeingFirms: ${finalFirmCount.rows[0].count} records (only with products)`);
    console.log(`   📦 CountProducts: ${finalProductCount.rows[0].count} records`);
    
    // List remaining firms
    const remainingFirms = await pool.query(`
      SELECT df.name, COUNT(cp.id) as product_count
      FROM "DyeingFirms" df
      LEFT JOIN "CountProducts" cp ON df.name = cp."dyeingFirm"
      GROUP BY df.name
      ORDER BY df.name
    `);
    
    console.log('\n📋 Remaining firms:');
    remainingFirms.rows.forEach(firm => {
      console.log(`   - ${firm.name}: ${firm.product_count} products`);
    });
    
  } catch (error) {
    console.error('❌ Database migration error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

createMissingTables();
