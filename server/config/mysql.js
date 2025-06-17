const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.MYSQL_DB,
  process.env.MYSQL_USER,
  process.env.MYSQL_PASSWORD,
  {
    host: process.env.MYSQL_HOST,
    dialect: 'mysql',
    logging: false, // Set to true if you want SQL logs
  }
);

const connectMySQL = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connected');
  } catch (err) {
    console.error('❌ MySQL connection error:', err);
  }
};

module.exports = { sequelize, connectMySQL };
