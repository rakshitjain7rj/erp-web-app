// create_dyeing_firms_table.js - Database migration for DyeingFirms table

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function createDyeingFirmsTable() {
  console.log('🚀 Setting up DyeingFirms table...\n');

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
    await client.query('DROP TABLE IF EXISTS "DyeingFirms" CASCADE');
    console.log('✅ Table dropped if existed');

    console.log('\n3. 🏗️  Creating DyeingFirms table...');
    const createTableQuery = `
      CREATE TABLE "DyeingFirms" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL UNIQUE CHECK ("name" <> ''),
        "contactPerson" VARCHAR(255),
        "phoneNumber" VARCHAR(20),
        "email" VARCHAR(255),
        "address" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "notes" TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `;
    await client.query(createTableQuery);
    console.log('✅ DyeingFirms table created');

    console.log('\n4. 📊 Creating indexes...');
    await client.query(`
      CREATE UNIQUE INDEX "dyeingfirms_name_unique" 
      ON "DyeingFirms" ("name")
    `);
    await client.query(`
      CREATE INDEX "dyeingfirms_isactive_idx" 
      ON "DyeingFirms" ("isActive")
    `);
    await client.query(`
      CREATE INDEX "dyeingfirms_createdat_idx" 
      ON "DyeingFirms" ("createdAt")
    `);
    console.log('✅ Indexes created');

    console.log('\n5. 📥 Inserting sample dyeing firms...');
    
    // Insert sample dyeing firms (commonly used ones)
    const sampleFirms = [
      {
        name: 'Rainbow Dyers',
        contactPerson: 'Rajesh Kumar',
        phoneNumber: '+91-9876543210',
        email: 'contact@rainbowdyers.com',
        address: 'Industrial Area, Sector 15, Gurgaon, Haryana',
        notes: 'Specialized in cotton and silk dyeing'
      },
      {
        name: 'ColorTech Solutions',
        contactPerson: 'Priya Sharma',
        phoneNumber: '+91-9876543211',
        email: 'info@colortech.in',
        address: 'Textile Hub, Coimbatore, Tamil Nadu',
        notes: 'Advanced chemical dyeing techniques'
      },
      {
        name: 'Premium Dye Works',
        contactPerson: 'Amit Patel',
        phoneNumber: '+91-9876543212',
        email: 'sales@premiumdye.co.in',
        address: 'Dyeing Complex, Surat, Gujarat',
        notes: 'High-quality fabric dyeing and finishing'
      },
      {
        name: 'Elite Textile Dyeing',
        contactPerson: 'Sunita Gupta',
        phoneNumber: '+91-9876543213',
        email: 'elite@textiledye.net',
        address: 'Industrial Estate, Ludhiana, Punjab',
        notes: 'Eco-friendly dyeing processes'
      },
      {
        name: 'Modern Dye House',
        contactPerson: 'Vikram Singh',
        phoneNumber: '+91-9876543214',
        email: 'modern@dyehouse.com',
        address: 'Textile Park, Erode, Tamil Nadu',
        notes: 'State-of-the-art dyeing facility'
      }
    ];

    for (const firm of sampleFirms) {
      const insertResult = await client.query(`
        INSERT INTO "DyeingFirms" 
        ("name", "contactPerson", "phoneNumber", "email", "address", "isActive", "notes", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING *
      `, [
        firm.name, firm.contactPerson, firm.phoneNumber, 
        firm.email, firm.address, true, firm.notes
      ]);
      console.log(`   ✅ Created: ${insertResult.rows[0].name}`);
    }

    console.log('\n6. 🧪 Testing table operations...');
    
    // Test search functionality
    const searchResult = await client.query(`
      SELECT * FROM "DyeingFirms" 
      WHERE LOWER("name") LIKE LOWER($1) 
      ORDER BY "name" ASC
    `, ['%rainbow%']);
    console.log('✅ Search test passed:', searchResult.rows.length, 'results found');
    
    // Test active firms query
    const activeFirms = await client.query(`
      SELECT "id", "name", "contactPerson", "phoneNumber" 
      FROM "DyeingFirms" 
      WHERE "isActive" = true 
      ORDER BY "name" ASC
    `);
    console.log('✅ Active firms query:', activeFirms.rows.length, 'active firms');

    console.log('\n7. 📋 Verifying table structure...');
    const tableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'DyeingFirms' 
      ORDER BY ordinal_position
    `);
    
    console.log('Table structure:');
    tableInfo.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });

    console.log('\n🎉 DyeingFirms table is ready and working!');
    console.log('💡 Sample data inserted for testing');
    console.log('🔗 API endpoints available at: /api/dyeing-firms');
    console.log('📚 Available endpoints:');
    console.log('   - GET    /api/dyeing-firms (get all active firms)');
    console.log('   - POST   /api/dyeing-firms (create new firm)');
    console.log('   - POST   /api/dyeing-firms/find-or-create (find or create)');
    console.log('   - GET    /api/dyeing-firms/:id (get by ID)');
    console.log('   - PUT    /api/dyeing-firms/:id (update firm)');
    console.log('   - DELETE /api/dyeing-firms/:id (soft delete)');
    
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

createDyeingFirmsTable();
