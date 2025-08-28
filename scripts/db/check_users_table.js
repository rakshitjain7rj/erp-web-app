// Check database tables and User model structure
const { sequelize } = require('./server/config/postgres');
const User = require('./server/models/User');

async function checkUserTable() {
  try {
    console.log('🔍 Checking Users table...');
    
    // Check if table exists
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'Users';
    `);
    
    console.log('📋 Users table exists:', tables.length > 0);
    
    if (tables.length > 0) {
      // Check table structure
      const [columns] = await sequelize.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'Users'
        ORDER BY ordinal_position;
      `);
      
      console.log('📊 Users table structure:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      
      // Check existing users
      const users = await User.findAll({ limit: 3 });
      console.log(`👥 Existing users count: ${users.length}`);
      users.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`);
      });
    } else {
      console.log('⚠️ Users table does not exist, need to create it');
      
      // Try to sync the model
      console.log('🔄 Attempting to create Users table...');
      await User.sync({ force: false });
      console.log('✅ Users table created successfully');
    }
    
  } catch (error) {
    console.error('❌ Error checking Users table:', error.message);
    console.error('📋 Error details:', error);
  } finally {
    process.exit(0);
  }
}

checkUserTable();
