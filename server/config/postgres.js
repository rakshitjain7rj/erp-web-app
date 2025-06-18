// server/config/postgres.js


const dotenv = require('dotenv');
dotenv.config();

console.log("POSTGRES_URI:", process.env.POSTGRES_URI);

const { Sequelize } = require('sequelize');




const sequelize = new Sequelize(process.env.POSTGRES_URI, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  logging: false,
});

const connectPostgres = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');
  } catch (err) {
    console.error('❌ PostgreSQL connection error:', err);
  }
};

module.exports = { sequelize, connectPostgres };

const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.POSTGRES_URI, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // Necessary for Neon
    },
  },
});

const connectPostgres = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected successfully');
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error);
  }
};

module.exports = { sequelize, connectPostgres };
