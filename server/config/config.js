require('dotenv').config();

module.exports = {
  development: {
    url: process.env.POSTGRES_URI || process.env.POSTGRES_URL || process.env.DATABASE_URL,
    dialect: 'postgres'
  },
  test: {
    url: process.env.POSTGRES_URI || process.env.POSTGRES_URL || process.env.DATABASE_URL,
    dialect: 'postgres'
  },
  production: {
    url: process.env.POSTGRES_URI || process.env.POSTGRES_URL || process.env.DATABASE_URL,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};
