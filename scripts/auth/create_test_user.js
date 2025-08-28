// Create a test to bypass any DB sync issues and test auth directly
const bcrypt = require('bcryptjs');

async function createTestUser() {
  try {
    const { sequelize } = require('./server/config/postgres');
    
    console.log('🧪 Creating test user directly in database...');
    
    // First, ensure the Users table has the right structure
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "Users" (
          "id" SERIAL PRIMARY KEY,
          "name" VARCHAR(255) NOT NULL,
          "email" VARCHAR(255) UNIQUE NOT NULL,
          "password" VARCHAR(255) NOT NULL,
          "role" VARCHAR(20) DEFAULT 'storekeeper',
          "status" VARCHAR(20) DEFAULT 'active',
          "loginHistory" TEXT DEFAULT '[]',
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      console.log('✅ Users table ensured');
    } catch (tableError) {
      console.log('⚠️ Table creation issue (might exist):', tableError.message);
    }
    
    // Clear any existing test users
    await sequelize.query(`DELETE FROM "Users" WHERE email = 'test@example.com';`);
    
    // Create a test user
    const hashedPassword = await bcrypt.hash('password123', 12);
    await sequelize.query(`
      INSERT INTO "Users" ("name", "email", "password", "role", "status", "createdAt", "updatedAt")
      VALUES ('Test User', 'test@example.com', '${hashedPassword}', 'storekeeper', 'active', NOW(), NOW());
    `);
    
    console.log('👤 Test user created: test@example.com / password123');
    
    // Verify user exists
    const [users] = await sequelize.query(`SELECT id, name, email, role FROM "Users" WHERE email = 'test@example.com';`);
    console.log('✅ User verified:', users[0]);
    
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
  } finally {
    process.exit(0);
  }
}

createTestUser();
