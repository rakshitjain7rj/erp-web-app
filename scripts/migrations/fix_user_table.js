// Fix User table structure and sync issues
const { sequelize } = require('./server/config/postgres');

async function fixUserTable() {
  try {
    console.log('🔧 Fixing User table structure...');
    
    // First, let's check if the table exists
    const [tables] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Users'
      );
    `);
    
    const tableExists = tables[0].exists;
    console.log('📋 Users table exists:', tableExists);
    
    if (tableExists) {
      // Check current structure
      const [columns] = await sequelize.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'Users'
        ORDER BY ordinal_position;
      `);
      
      console.log('📊 Current Users table structure:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
      
      // Check if loginHistory column has wrong type
      const loginHistoryColumn = columns.find(col => col.column_name === 'loginHistory');
      if (loginHistoryColumn && loginHistoryColumn.data_type !== 'jsonb') {
        console.log('🔄 Fixing loginHistory column type...');
        
        // Drop and recreate the problematic column
        await sequelize.query('ALTER TABLE "Users" DROP COLUMN IF EXISTS "loginHistory";');
        await sequelize.query('ALTER TABLE "Users" ADD COLUMN "loginHistory" JSONB DEFAULT \'[]\';');
        
        console.log('✅ loginHistory column fixed');
      }
      
      // Add status column if missing (it's commented out in model but used in controllers)
      const statusColumn = columns.find(col => col.column_name === 'status');
      if (!statusColumn) {
        console.log('🔄 Adding missing status column...');
        await sequelize.query(`
          ALTER TABLE "Users" 
          ADD COLUMN "status" VARCHAR(20) DEFAULT 'active' 
          CHECK ("status" IN ('active', 'inactive'));
        `);
        console.log('✅ status column added');
      }
      
    } else {
      console.log('🔄 Creating Users table from scratch...');
      
      // Create the table with correct structure
      await sequelize.query(`
        CREATE TABLE "Users" (
          "id" SERIAL PRIMARY KEY,
          "name" VARCHAR(255) NOT NULL,
          "email" VARCHAR(255) UNIQUE NOT NULL,
          "password" VARCHAR(255) NOT NULL,
          "role" VARCHAR(20) DEFAULT 'storekeeper' CHECK ("role" IN ('admin', 'manager', 'storekeeper')),
          "status" VARCHAR(20) DEFAULT 'active' CHECK ("status" IN ('active', 'inactive')),
          "loginHistory" JSONB DEFAULT '[]',
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      
      console.log('✅ Users table created successfully');
    }
    
    // Create a test admin user if none exists
    const [userCount] = await sequelize.query('SELECT COUNT(*) as count FROM "Users";');
    if (userCount[0].count === '0') {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      await sequelize.query(`
        INSERT INTO "Users" ("name", "email", "password", "role", "status", "createdAt", "updatedAt")
        VALUES ('Admin', 'admin@example.com', '${hashedPassword}', 'admin', 'active', NOW(), NOW());
      `);
      
      console.log('👤 Test admin user created: admin@example.com / admin123');
    }
    
    console.log('✅ User table fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing User table:', error.message);
    console.error('📋 Full error:', error);
  } finally {
    process.exit(0);
  }
}

fixUserTable();
