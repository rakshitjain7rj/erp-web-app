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

const sequelize = new Sequelize(
  DB_NAME,
  DB_USER,
  DB_PASSWORD, 
  {
    host: DB_HOST,
    port: DB_PORT,
    dialect: 'postgres',
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false,
      } : false
    },
    logging: false,
  });

const connectPostgres = async () => {
  try {
    await sequelize.authenticate(); 
    console.log('✅ PostgreSQL connected');
    return true;
  } catch (err) {
    console.error('❌ PostgreSQL connection error:', err);
    console.log('⚠️ App will continue to run with limited functionality - database features will not work');
    return false;
  }
};
console.log('Attempting to connect to DB:', sequelize.config.host);


module.exports = { sequelize, connectPostgres };
