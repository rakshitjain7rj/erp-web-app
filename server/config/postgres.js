const { Sequelize } = require('sequelize');

const NODE_ENV = process.env.NODE_ENV || 'development';
let sequelize;
let usingUri = false;

// Support multiple common env var names for the Postgres connection string
const POSTGRES_URI = process.env.POSTGRES_URI || process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (POSTGRES_URI) {
  // Prefer URI if provided in any environment (dev/prod). Managed providers often require SSL.
  usingUri = true;
  let sslRequired = true;
  try {
    const parsed = new URL(POSTGRES_URI);
    const host = (parsed.hostname || '').toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) {
      sslRequired = false;
    }
    // If connection string explicitly disables SSL, respect it
    if (parsed.searchParams.get('sslmode') === 'disable') {
      sslRequired = false;
    }
  } catch {
    // If URL parsing fails, keep default sslRequired=true for safety on managed providers
  }

  sequelize = new Sequelize(POSTGRES_URI, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: sslRequired ? {
        require: true,
        rejectUnauthorized: false,
      } : false,
    },
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
  if (NODE_ENV === 'production') {
    console.warn('[DB] Warning -> Using discrete DB variables in production (no POSTGRES_URI/POSTGRES_URL/DATABASE_URL provided)');
  }

  sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: 'postgres',
    dialectOptions: {
      ssl: requiresSSL ? {
        require: true,
        rejectUnauthorized: false,
      } : false,
    },
    logging: false,
  });
}

// Startup summary log
console.log(
  `[DB] Startup -> NODE_ENV=${NODE_ENV} | using ${usingUri ? 'URI (POSTGRES_URI/URL/DATABASE_URL)' : 'discrete variables'} | dialect=postgres`
);

const connectPostgres = async () => {
  try {
    console.log(`Attempting PostgreSQL connection (env=${NODE_ENV}) using ${usingUri ? 'URI' : 'discrete credentials'}`);
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected successfully');
    return true;
  } catch (err) {
    console.error('❌ PostgreSQL connection error:', err.message);
    if (err.message && err.message.includes('sslmode=require')) {
      console.log('💡 SSL Required: This database requires SSL connection');
    }
    if (err.message && err.message.toLowerCase().includes('authentication')) {
      console.log('💡 Check your database credentials / POSTGRES_URI/URL/DATABASE_URL');
    }
    if (err.code === 'ENOTFOUND' || (err.message && err.message.includes('ENOTFOUND'))) {
      console.log('💡 Host not found - verify DB_HOST or connection string host');
    }
    console.log('⚠️ App will continue to run with limited functionality - database features will not work');
    return false;
  }
};

module.exports = { sequelize, connectPostgres };
