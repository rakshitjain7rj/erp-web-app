const dotenv = require('dotenv');
dotenv.config();

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
