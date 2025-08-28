// fix_count_product_table.js - Direct database fix

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function fixCountProductTable() {
  console.log('🚀 Fixing CountProductFollowUp table directly...\n');

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
    await client.query('DROP TABLE IF EXISTS "CountProductFollowUps" CASCADE');
    console.log('✅ Table dropped if existed');

    console.log('\n3. 🏗️  Creating CountProductFollowUps table...');
    const createTableQuery = `
      CREATE TABLE "CountProductFollowUps" (
        "id" SERIAL PRIMARY KEY,
        "countProductId" INTEGER NOT NULL,
        "followUpDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "remarks" TEXT NOT NULL,
        "addedBy" INTEGER DEFAULT 1,
        "addedByName" VARCHAR(255) DEFAULT 'System User',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `;
    await client.query(createTableQuery);
    console.log('✅ CountProductFollowUps table created');

    console.log('\n4. 📊 Creating indexes...');
    await client.query(`
      CREATE INDEX "countproductfollowups_countproductid_idx" 
      ON "CountProductFollowUps" ("countProductId")
    `);
    await client.query(`
      CREATE INDEX "countproductfollowups_addedby_idx" 
      ON "CountProductFollowUps" ("addedBy")
    `);
    console.log('✅ Indexes created');

    console.log('\n5. 🧪 Testing table operations...');
    
    // Insert test record
    const insertResult = await client.query(`
      INSERT INTO "CountProductFollowUps" 
      ("countProductId", "followUpDate", "remarks", "addedBy", "addedByName", "createdAt", "updatedAt")
      VALUES ($1, NOW(), $2, $3, $4, NOW(), NOW())
      RETURNING *
    `, [1, 'Test follow-up - direct table creation', 1, 'System Test']);
    
    const testRecord = insertResult.rows[0];
    console.log('✅ Test record created:', testRecord.id);

    // Query test record
    const queryResult = await client.query(`
      SELECT * FROM "CountProductFollowUps" WHERE "countProductId" = $1
    `, [1]);
    console.log('✅ Test record queried:', queryResult.rows.length, 'records found');

    // Clean up test record
    await client.query(`
      DELETE FROM "CountProductFollowUps" WHERE "id" = $1
    `, [testRecord.id]);
    console.log('✅ Test record cleaned up');

    console.log('\n6. 📋 Table structure:');
    const tableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'CountProductFollowUps'
      ORDER BY ordinal_position
    `);
    
    tableInfo.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });

    console.log('\n🎉 CountProductFollowUp table is ready and working!');
    console.log('💡 You can now restart the server and test the follow-up functionality');
    
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

// Load environment variables
require('dotenv').config({ path: './server/.env' });

fixCountProductTable();
