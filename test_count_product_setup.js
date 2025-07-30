// test_count_product_setup.js - Test Count Product Follow-up setup

const path = require('path');

// Change to server directory
const serverDir = path.join(__dirname, 'server');
process.chdir(serverDir);

async function testCountProductFollowUpSetup() {
  console.log('🚀 Testing Count Product Follow-up setup...\n');

  try {
    // Load environment and database
    require('dotenv').config();
    
    const { sequelize } = require('./config/postgres');
    
    console.log('1. 📡 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful');

    // Load and sync models
    console.log('\n2. 🏗️  Loading and syncing models...');
    const CountProductFollowUp = require('./models/CountProductFollowUp');
    
    // Sync the specific model
    await CountProductFollowUp.sync({ alter: true });
    console.log('✅ CountProductFollowUp model synced');

    // Test model operations
    console.log('\n3. 🧪 Testing model operations...');
    
    // Create a test follow-up
    const testFollowUp = await CountProductFollowUp.create({
      countProductId: 999, // Test ID
      followUpDate: new Date(),
      remarks: 'Test follow-up from setup script',
      addedBy: 1,
      addedByName: 'System Test'
    });
    console.log('✅ Test follow-up created:', testFollowUp.id);
    
    // Query it back
    const foundFollowUp = await CountProductFollowUp.findByPk(testFollowUp.id);
    console.log('✅ Test follow-up retrieved:', foundFollowUp?.remarks);
    
    // Clean up test data
    await testFollowUp.destroy();
    console.log('✅ Test follow-up cleaned up');

    console.log('\n🎉 Count Product Follow-up system is ready!');
    console.log('💡 Start the server now with: cd server && node index.js');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   - Make sure PostgreSQL is running');
    console.log('   - Check .env file in server directory');
    console.log('   - Verify database exists: yarn_erp');
  }
  
  process.exit(0);
}

testCountProductFollowUpSetup();
