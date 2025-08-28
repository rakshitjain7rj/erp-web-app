// Create working test user for login
const { sequelize } = require('./server/config/postgres');
const bcrypt = require('bcryptjs');

async function createWorkingTestUser() {
  try {
    console.log('🔧 Creating working test user for login...');
    
    // Create a properly hashed password
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Delete any existing test user
    await sequelize.query(`DELETE FROM "Users" WHERE email = 'test@test.com';`);
    
    // Insert new test user
    const [result] = await sequelize.query(`
      INSERT INTO "Users" ("name", "email", "password", "role", "status", "loginHistory", "createdAt", "updatedAt")
      VALUES ('Test User', 'test@test.com', '${hashedPassword}', 'storekeeper', 'active', '[]', NOW(), NOW())
      RETURNING id, name, email, role;
    `);
    
    console.log('✅ Test user created successfully!');
    console.log('📋 User details:', result[0]);
    console.log('');
    console.log('🔑 LOGIN CREDENTIALS:');
    console.log('   Email: test@test.com');
    console.log('   Password: password123');
    console.log('');
    console.log('💡 You can now use these credentials to login in the frontend!');
    
    // Also create an admin user
    const adminPassword = 'admin123';
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 12);
    
    await sequelize.query(`DELETE FROM "Users" WHERE email = 'admin@admin.com';`);
    
    const [adminResult] = await sequelize.query(`
      INSERT INTO "Users" ("name", "email", "password", "role", "status", "loginHistory", "createdAt", "updatedAt")
      VALUES ('Admin User', 'admin@admin.com', '${hashedAdminPassword}', 'admin', 'active', '[]', NOW(), NOW())
      RETURNING id, name, email, role;
    `);
    
    console.log('✅ Admin user created successfully!');
    console.log('📋 Admin details:', adminResult[0]);
    console.log('');
    console.log('🔑 ADMIN CREDENTIALS:');
    console.log('   Email: admin@admin.com');
    console.log('   Password: admin123');
    
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
  } finally {
    process.exit(0);
  }
}

createWorkingTestUser();
