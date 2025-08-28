const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:g7o9B53gJgMd@ep-old-snow-a85chxyu-pooler.eastus2.azure.neon.tech/neondb?sslmode=require'
});

async function createDyeingRecordsTable() {
  try {
    console.log('🚀 Creating DyeingRecords table...');
    
    // Create the DyeingRecords table based on the Sequelize model
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "DyeingRecords" (
        "id" SERIAL PRIMARY KEY,
        "yarnType" VARCHAR(255) NOT NULL,
        "sentDate" TIMESTAMPTZ NOT NULL,
        "expectedArrivalDate" TIMESTAMPTZ,
        "arrivalDate" TIMESTAMPTZ,
        "partyName" VARCHAR(255) NOT NULL,
        "quantity" DECIMAL(10,2) NOT NULL,
        "shade" VARCHAR(255) NOT NULL,
        "count" VARCHAR(255) NOT NULL,
        "lot" VARCHAR(255) NOT NULL,
        "dyeingFirm" VARCHAR(255) NOT NULL,
        "remarks" TEXT,
        "status" VARCHAR(50) DEFAULT 'pending',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    
    console.log('✅ DyeingRecords table created successfully!');
    
    // Verify the table was created
    const tableCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'DyeingRecords' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 DyeingRecords table columns:');
    tableCheck.rows.forEach(row => {
      console.log('  -', row.column_name, '(' + row.data_type + ')');
    });
    
    await pool.end();
    console.log('🎉 Database setup complete!');
    
  } catch (error) {
    console.error('❌ Failed to create DyeingRecords table:', error.message);
    await pool.end();
  }
}

createDyeingRecordsTable();
