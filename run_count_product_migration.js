// run_count_product_migration.js - Fix CountProductFollowUp table creation

const path = require('path');

// Change to server directory
const serverDir = path.join(__dirname, 'server');
process.chdir(serverDir);

async function createCountProductFollowUpTable() {
  console.log('🚀 Creating CountProductFollowUp table...\n');

  try {
    // Load environment and database
    require('dotenv').config();
    
    const { sequelize } = require('./config/postgres');
    
    console.log('1. 📡 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful');

    // First, let's check if the table exists
    console.log('\n2. 🔍 Checking existing tables...');
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%followup%'
    `);
    console.log('Existing follow-up tables:', tables.map(t => t.table_name));

    // Drop the table if it exists to recreate it properly
    console.log('\n3. 🗑️  Dropping existing table if exists...');
    await sequelize.query('DROP TABLE IF EXISTS "CountProductFollowUps" CASCADE');
    console.log('✅ Table dropped if existed');

    // Create the table with proper structure
    console.log('\n4. 🏗️  Creating CountProductFollowUps table...');
    await sequelize.query(`
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
    `);
    console.log('✅ CountProductFollowUps table created');

    // Create indexes for performance
    console.log('\n5. 📊 Creating indexes...');
    await sequelize.query(`
      CREATE INDEX "countproductfollowups_countproductid_idx" 
      ON "CountProductFollowUps" ("countProductId");
    `);
    await sequelize.query(`
      CREATE INDEX "countproductfollowups_addedby_idx" 
      ON "CountProductFollowUps" ("addedBy");
    `);
    console.log('✅ Indexes created');

    // Test the model now
    console.log('\n6. 🧪 Testing model operations...');
    const CountProductFollowUp = require('./models/CountProductFollowUp');
    
    // Create a test follow-up
    const testFollowUp = await CountProductFollowUp.create({
      countProductId: 999,
      followUpDate: new Date(),
      remarks: 'Test follow-up - table creation successful',
      addedBy: 1,
      addedByName: 'System Test'
    });
    console.log('✅ Test follow-up created:', testFollowUp.id);
    
    // Query it back
    const foundFollowUp = await CountProductFollowUp.findByPk(testFollowUp.id);
    console.log('✅ Test follow-up retrieved:', foundFollowUp?.remarks);
    
    // Query all for countProductId 999
    const allTestFollowUps = await CountProductFollowUp.findAll({
      where: { countProductId: 999 },
      order: [['followUpDate', 'DESC']]
    });
    console.log('✅ Found follow-ups for test product:', allTestFollowUps.length);
    
    // Clean up test data
    await testFollowUp.destroy();
    console.log('✅ Test follow-up cleaned up');

    console.log('\n🎉 CountProductFollowUp table is ready and working!');
    console.log('💡 You can now start the server with: node index.js');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   - Make sure PostgreSQL is running');
    console.log('   - Check .env file configuration');
    console.log('   - Verify database exists: yarn_erp');
    console.log('   - Ensure user has CREATE TABLE permissions');
  }
  
  process.exit(0);
}

createCountProductFollowUpTable();
