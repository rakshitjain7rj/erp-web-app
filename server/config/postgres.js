const { Sequelize } = require('sequelize');

const NODE_ENV = process.env.NODE_ENV || 'development';
let sequelize;
let usingUri = false;

if (NODE_ENV === 'production' && process.env.POSTGRES_URI) {
  // Azure Postgres requires SSL
  usingUri = true;
  sequelize = new Sequelize(process.env.POSTGRES_URI, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      }
    }
  });
} else {
  // Fallback to discrete credentials (development / legacy)
  const DB_NAME = process.env.DB_NAME || 'yarn_erp';
  const DB_USER = process.env.DB_USER || 'postgres';
  const DB_PASSWORD = process.env.DB_PASSWORD || 'password';
  const DB_HOST = process.env.DB_HOST || 'localhost';
  const DB_PORT = process.env.DB_PORT || 5432;

  const requiresSSL = DB_HOST.includes('neon.tech') ||
                      DB_HOST.includes('amazonaws.com') ||
                      DB_HOST.includes('railway.app') ||
                      DB_HOST.includes('heroku') ||
                      NODE_ENV === 'production';
  if (NODE_ENV === 'production' && !process.env.POSTGRES_URI) {
    console.warn('[DB] Warning -> NODE_ENV=production but POSTGRES_URI is not set; falling back to discrete variables');
  }

  sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
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
}

// Startup summary log
console.log(
  `[DB] Startup -> NODE_ENV=${NODE_ENV} | using ${usingUri ? 'POSTGRES_URI' : 'discrete variables'} | dialect=postgres`
);

const connectPostgres = async () => {
  try {
    console.log(`Attempting PostgreSQL connection (env=${NODE_ENV}) using ${usingUri ? 'URI' : 'discrete credentials'}`);
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected successfully');
    return true;
  } catch (err) {
    console.error('❌ PostgreSQL connection error:', err.message);
    if (err.message.includes('sslmode=require')) {
      console.log('💡 SSL Required: This database requires SSL connection');
    }
    if (err.message.includes('authentication failed')) {
      console.log('💡 Check your database credentials / POSTGRES_URI');
    }
    if (err.message.includes('ENOTFOUND')) {
      console.log('💡 Host not found - verify DB_HOST or POSTGRES_URI host');
    }
    console.log('⚠️ App will continue to run with limited functionality - database features will not work');
    return false;
  }
};

module.exports = { sequelize, connectPostgres };
