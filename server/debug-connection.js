const dotenv = require('dotenv');
const path = require('path');

// Load environment file explicitly
const NODE_ENV = process.env.NODE_ENV || 'development';
console.log('NODE_ENV:', NODE_ENV);

const envFileSpecific = path.resolve(__dirname, `.env.${NODE_ENV}`);
const envFileDefault = path.resolve(__dirname, '.env');

console.log('Looking for env files:');
console.log('Specific env file:', envFileSpecific);
console.log('Default env file:', envFileDefault);

let loadedPath = null;
if (require('fs').existsSync(envFileSpecific)) {
  dotenv.config({ path: envFileSpecific });
  loadedPath = envFileSpecific;
  console.log('✅ Loaded specific env file:', envFileSpecific);
} else if (require('fs').existsSync(envFileDefault)) {
  dotenv.config({ path: envFileDefault });
  loadedPath = envFileDefault;
  console.log('✅ Loaded default env file:', envFileDefault);
} else {
  dotenv.config();
  loadedPath = 'process.env only (no .env file found)';
  console.log('⚠️ No .env file found, using process.env only');
}

console.log('\nDatabase config from environment:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'undefined');
console.log('DB_NAME:', process.env.DB_NAME);
console.log('POSTGRES_URI:', process.env.POSTGRES_URI ? 'defined' : 'undefined');

// Now test the connection
const { connectPostgres, sequelize } = require('./config/postgres');

async function testConnection() {
  console.log('\nTesting database connection...');
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
