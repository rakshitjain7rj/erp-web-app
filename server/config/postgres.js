const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Sequelize } = require('sequelize');

// Use default values if environment variables are not available
const DB_NAME = process.env.DB_NAME || 'yarn_erp';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'password';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;

console.log('🔧 PostgreSQL Config:', {
  database: DB_NAME,
  user: DB_USER,
  host: DB_HOST,
  port: DB_PORT
});

// Determine if SSL is required based on host or environment
const requiresSSL = DB_HOST.includes('neon.tech') || 
                   DB_HOST.includes('amazonaws.com') || 
                   DB_HOST.includes('railway.app') || 
                   DB_HOST.includes('heroku') ||
                   process.env.NODE_ENV === 'production';

console.log('🔧 SSL Configuration:', { requiresSSL, host: DB_HOST });

const sequelize = new Sequelize(
  DB_NAME,
  DB_USER,
  DB_PASSWORD, 
  {
    host: DB_HOST,
    port: DB_PORT,
    dialect: 'postgres',
    dialectOptions: {
      ssl: requiresSSL ? {
        require: true,
        rejectUnauthorized: false,
      } : false
    },
    logging: false,
  });

const connectPostgres = async () => {
  try {
    console.log(`Attempting to connect to DB: ${DB_HOST}`);
    await sequelize.authenticate(); 
    console.log('✅ PostgreSQL connected successfully');
    return true;
  } catch (err) {
    console.error('❌ PostgreSQL connection error:', err.message);
    
    // Provide specific guidance for common errors
    if (err.message.includes('sslmode=require')) {
      console.log('💡 SSL Required: This database requires SSL connection');
    }
    if (err.message.includes('authentication failed')) {
      console.log('💡 Check your database credentials in .env file');
    }
    if (err.message.includes('ENOTFOUND')) {
      console.log('💡 Check your database host URL in .env file');
    }
    
    console.log('⚠️ App will continue to run with limited functionality - database features will not work');
    return false;
  }
};

module.exports = { sequelize, connectPostgres };
