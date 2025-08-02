// create_count_products_table.js - Database migration for CountProducts table

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function createCountProductsTable() {
  console.log('🚀 Setting up CountProducts table...\n');

  // Load environment variables
  require('dotenv').config({ path: './server/.env' });

  // Database connection config
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'yarn_erp',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password'
  };

  console.log('Database config:', {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user,
    password: '***'
  });

  const client = new Client(dbConfig);

  try {
    console.log('1. 📡 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected to database');

    console.log('\n2. 🗑️  Dropping existing table if exists...');
    await client.query('DROP TABLE IF EXISTS "CountProducts" CASCADE');
    console.log('✅ Table dropped if existed');

    console.log('\n3. 🏗️  Creating CountProducts table...');
    const createTableQuery = `
      CREATE TABLE "CountProducts" (
        "id" SERIAL PRIMARY KEY,
        "partyName" VARCHAR(255) NOT NULL CHECK ("partyName" <> ''),
        "dyeingFirm" VARCHAR(255) NOT NULL CHECK ("dyeingFirm" <> ''),
        "yarnType" VARCHAR(255) NOT NULL CHECK ("yarnType" <> ''),
        "count" VARCHAR(255) NOT NULL CHECK ("count" <> ''),
        "shade" VARCHAR(255) NOT NULL CHECK ("shade" <> ''),
        "quantity" DECIMAL(10, 2) NOT NULL CHECK ("quantity" >= 0),
        "completedDate" DATE NOT NULL,
        "qualityGrade" VARCHAR(1) NOT NULL DEFAULT 'A' CHECK ("qualityGrade" IN ('A', 'B', 'C')),
        "remarks" TEXT,
        "lotNumber" VARCHAR(255) NOT NULL UNIQUE CHECK ("lotNumber" <> ''),
        "processedBy" VARCHAR(255) DEFAULT 'System',
        "customerName" VARCHAR(255) NOT NULL CHECK ("customerName" <> ''),
        "sentToDye" BOOLEAN NOT NULL DEFAULT true,
        "sentDate" DATE,
        "received" BOOLEAN NOT NULL DEFAULT false,
        "receivedDate" DATE,
        "receivedQuantity" DECIMAL(10, 2) DEFAULT 0 CHECK ("receivedQuantity" >= 0),
        "dispatch" BOOLEAN NOT NULL DEFAULT false,
        "dispatchDate" DATE,
        "dispatchQuantity" DECIMAL(10, 2) DEFAULT 0 CHECK ("dispatchQuantity" >= 0),
        "middleman" VARCHAR(255) DEFAULT 'Direct Supply',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `;
    await client.query(createTableQuery);
    console.log('✅ CountProducts table created');

    console.log('\n4. 📊 Creating indexes...');
    await client.query(`
      CREATE INDEX "countproducts_partyname_idx" 
      ON "CountProducts" ("partyName")
    `);
    await client.query(`
      CREATE INDEX "countproducts_dyeingfirm_idx" 
      ON "CountProducts" ("dyeingFirm")
    `);
    await client.query(`
      CREATE INDEX "countproducts_completeddate_idx" 
      ON "CountProducts" ("completedDate")
    `);
    await client.query(`
      CREATE UNIQUE INDEX "countproducts_lotnumber_unique" 
      ON "CountProducts" ("lotNumber")
    `);
    console.log('✅ Indexes created');

    console.log('\n5. 🧪 Testing table operations...');
    
    // Insert test record
    const insertResult = await client.query(`
      INSERT INTO "CountProducts" 
      ("partyName", "dyeingFirm", "yarnType", "count", "shade", "quantity", 
       "completedDate", "qualityGrade", "remarks", "lotNumber", "processedBy", 
       "customerName", "sentToDye", "sentDate", "received", "receivedDate", 
       "receivedQuantity", "dispatch", "dispatchDate", "dispatchQuantity", 
       "middleman", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW(), NOW())
      RETURNING *
    `, [
      'Test Party', 'Test Dyeing Firm', 'Cotton Combed', '30s', 'Navy Blue', 
      150.00, '2025-01-17', 'A', 'Test count product creation', 'TEST-2025-001', 
      'System Test', 'Test Customer', true, '2025-01-15', true, '2025-01-16', 
      148.50, false, null, 0.00, 'Direct Supply'
    ]);
    
    console.log('✅ Test record created:', insertResult.rows[0].id);
    
    // Query it back
    const queryResult = await client.query('SELECT * FROM "CountProducts" WHERE "id" = $1', [insertResult.rows[0].id]);
    console.log('✅ Test record retrieved:', queryResult.rows[0].partyName);
    
    // Clean up test data
    await client.query('DELETE FROM "CountProducts" WHERE "id" = $1', [insertResult.rows[0].id]);
    console.log('✅ Test record cleaned up');

    console.log('\n6. 📋 Verifying table structure...');
    const tableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'CountProducts' 
      ORDER BY ordinal_position
    `);
    
    console.log('Table structure:');
    tableInfo.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });

    console.log('\n🎉 CountProducts table is ready and working!');
    console.log('💡 You can now restart the server and test the count product functionality');
    
  } catch (error) {
    console.error('❌ Database operation failed:', error.message);
    console.error('Full error:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   - Make sure PostgreSQL is running');
    console.log('   - Check database credentials');
    console.log('   - Verify database "yarn_erp" exists');
    console.log('   - Ensure user has CREATE TABLE permissions');
  } finally {
    await client.end();
  }
}

createCountProductsTable();
