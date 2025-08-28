// Migration script to add sentQuantity column to CountProducts table
const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const config = {
  user: process.env.DB_USER || 'neondb_owner',
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST || 'ep-old-snow-a85chxyu-pooler.eastus2.azure.neon.tech',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'neondb',
  ssl: {
    require: true,
    rejectUnauthorized: false
  }
};

console.log('🔧 PostgreSQL Config:', {
  database: config.database,
  user: config.user,
  host: config.host,
  port: config.port
});

async function runMigration() {
  const pool = new Pool(config);
  
  try {
    console.log('🔗 Connecting to database...');
    
    // Check if column already exists
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'CountProducts' AND column_name = 'sentQuantity'
    `);
    
    if (checkColumn.rows.length > 0) {
      console.log('✅ sentQuantity column already exists, skipping migration');
      return;
    }
    
    console.log('🔄 Adding sentQuantity column...');
    
    // Add the sentQuantity column
    await pool.query(`
      ALTER TABLE "CountProducts" 
      ADD COLUMN "sentQuantity" DECIMAL(10,2)
    `);
    
    console.log('✅ sentQuantity column added successfully');
    
    // Set default values for existing records
    console.log('🔄 Setting default values for existing records...');
    const updateResult = await pool.query(`
      UPDATE "CountProducts" 
      SET "sentQuantity" = "quantity" 
      WHERE "sentQuantity" IS NULL
    `);
    
    console.log(`✅ Updated ${updateResult.rowCount} existing records with default sentQuantity values`);
    
    // Verify the migration
    console.log('🔍 Verifying migration...');
    const verifyResult = await pool.query(`
      SELECT id, "partyName", "quantity", "sentQuantity" 
      FROM "CountProducts" 
      LIMIT 5
    `);
    
    console.log('📋 Sample data after migration:');
    verifyResult.rows.forEach(row => {
      console.log(`  ID: ${row.id}, Party: ${row.partyName}, Quantity: ${row.quantity}, SentQuantity: ${row.sentQuantity}`);
    });
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log('✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });
