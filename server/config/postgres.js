const { Sequelize } = require('sequelize');

// Helper to mask password in a Postgres URI
function maskPostgresUri(uri) {
  if (!uri || typeof uri !== 'string') return uri;
  try {
    return uri.replace(/(postgres(?:ql)?:\/\/[^:]+:)([^@]+)(@.*)/, '$1***$3');
  } catch (_) {
    return uri;
  }
}

const NODE_ENV = process.env.NODE_ENV || 'development';
let sequelize;
let usingUri = false;

if (NODE_ENV === 'production' && process.env.POSTGRES_URI) {
  // Render Postgres typically requires SSL
  usingUri = true;
  const masked = maskPostgresUri(process.env.POSTGRES_URI);
  console.log('🔧 Using production POSTGRES_URI');
  console.log('🔒 Database URI (masked):', masked);
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

  console.log('🔧 Using discrete DB config (not POSTGRES_URI)', {
    env: NODE_ENV,
    database: DB_NAME,
    user: DB_USER,
    host: DB_HOST,
    port: DB_PORT,
    ssl: requiresSSL
  });

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
