// Quick database fix for CountProducts sentToDye column
const { Pool } = require('pg');

const pool = new Pool({
  user: 'neondb_owner',
  host: 'ep-old-snow-a85chxyu-pooler.eastus2.azure.neon.tech',
  database: 'neondb',
  password: 'npg_J0IkBnaKcHS6',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

async function fixCountProductsTable() {
  try {
    console.log('🔧 Fixing CountProducts table schema...');
    
    // Check if table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'CountProducts'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ CountProducts table does not exist, creating it...');
      
      // Create the table with correct schema
      await pool.query(`
        CREATE TABLE "CountProducts" (
          id SERIAL PRIMARY KEY,
          "partyName" VARCHAR(255) NOT NULL,
          "dyeingFirm" VARCHAR(255),
          "orderNumber" VARCHAR(100),
          "productName" VARCHAR(255),
          "quality" VARCHAR(100),
          "design" VARCHAR(100),
          "totalPieces" INTEGER DEFAULT 0,
          "totalMeters" DECIMAL(10,2) DEFAULT 0,
          "rate" DECIMAL(10,2) DEFAULT 0,
          "sentToDye" BOOLEAN DEFAULT false,
          "completedDate" DATE,
          "remarks" TEXT,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('✅ CountProducts table created successfully with correct schema');
    } else {
      console.log('✅ CountProducts table exists, checking schema...');
      
      // Check current sentToDye column type
      const columnInfo = await pool.query(`
        SELECT data_type, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'CountProducts' 
        AND column_name = 'sentToDye'
      `);
      
      if (columnInfo.rows.length > 0) {
        const currentType = columnInfo.rows[0].data_type;
        const currentDefault = columnInfo.rows[0].column_default;
        
        console.log(`Current sentToDye type: ${currentType}, default: ${currentDefault}`);
        
        if (currentType === 'numeric') {
          console.log('🔧 Fixing sentToDye column type from numeric to boolean...');
          
          // Fix the column type
          await pool.query(`ALTER TABLE "CountProducts" ALTER COLUMN "sentToDye" TYPE BOOLEAN USING CASE WHEN "sentToDye" = 1 THEN true ELSE false END`);
          await pool.query(`ALTER TABLE "CountProducts" ALTER COLUMN "sentToDye" SET DEFAULT false`);
          
          console.log('✅ sentToDye column type fixed to boolean');
        } else {
          console.log('✅ sentToDye column type is already correct');
        }
      } else {
        console.log('❌ sentToDye column not found, adding it...');
        await pool.query(`ALTER TABLE "CountProducts" ADD COLUMN "sentToDye" BOOLEAN DEFAULT false`);
        console.log('✅ sentToDye column added');
      }
    }
    
    // Test the table
    const testQuery = await pool.query('SELECT COUNT(*) FROM "CountProducts"');
    console.log(`📊 CountProducts table has ${testQuery.rows[0].count} records`);
    
  } catch (error) {
    console.error('❌ Error fixing CountProducts table:', error.message);
  } finally {
    await pool.end();
  }
}

fixCountProductsTable();
