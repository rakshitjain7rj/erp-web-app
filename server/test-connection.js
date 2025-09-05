const { connectPostgres, sequelize } = require('./config/postgres');

async function testConnection() {
  console.log('Testing database connection...');
  const result = await connectPostgres();
  
  if (result) {
    console.log('✅ Database connection successful!');
    try {
      await sequelize.close();
      console.log('Connection closed.');
    } catch (err) {
      console.log('Error closing connection:', err.message);
    }
  } else {
    console.log('❌ Database connection failed!');
  }
  process.exit(0);
}

testConnection().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
