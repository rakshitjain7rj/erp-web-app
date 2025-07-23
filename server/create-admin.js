const { sequelize } = require('./config/postgres');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      where: { email: 'admin@example.com' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      process.exit(0);
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('admin123', saltRounds);

    // Create admin user
    await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
    });

    console.log('✅ Admin user created successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();
