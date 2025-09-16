// Base load of default .env (development)
require('dotenv').config();

// If running in production (NODE_ENV or SEQUELIZE_ENV) and no URI yet, attempt to load
// .env.production.local then .env.production (supporting export syntax) so sequelize-cli
// can resolve POSTGRES_URI without external preload wrapper.
const envHint = process.env.NODE_ENV || process.env.SEQUELIZE_ENV;
if ((envHint === 'production') && !process.env.POSTGRES_URI && !process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
  const fs = require('fs');
  const path = require('path');
  const candidates = ['.env.production.local', '.env.production'];
  for (const file of candidates) {
    const full = path.join(process.cwd(), file);
    if (fs.existsSync(full)) {
      try {
        const raw = fs.readFileSync(full, 'utf8');
        if (/^export\s+/m.test(raw)) {
          raw.split(/\n+/).forEach(line => {
            const m = line.match(/^export\s+([A-Z0-9_]+)=("?)(.*)\2$/);
            if (m) {
              const [, k,, v] = m;
              if (!process.env[k]) process.env[k] = v;
            }
          });
        } else {
          require('dotenv').config({ path: full });
        }
        if (process.env.POSTGRES_URI || process.env.POSTGRES_URL || process.env.DATABASE_URL) {
          if (process.env.DEBUG_SEQUELIZE_CONFIG === '1') {
            console.log('[SequelizeConfig] loaded production env file %s', file);
          }
          break;
        }
      } catch (err) {
        if (process.env.DEBUG_SEQUELIZE_CONFIG === '1') {
          console.warn('[SequelizeConfig] failed loading %s -> %s', file, err.message);
        }
      }
    }
  }
}

const URL_ENV = 'POSTGRES_URI';
const resolved = process.env[URL_ENV] || process.env.POSTGRES_URL || process.env.DATABASE_URL;

const common = {
  dialect: 'postgres',
  logging: false,
  pool: { max: 10, min: 0, idle: 10000, acquire: 30000 }
};

module.exports = {
  development: resolved ? { use_env_variable: URL_ENV, ...common } : {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'yarn_erp',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    ...common
  },
  test: resolved ? { use_env_variable: URL_ENV, ...common } : {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: (process.env.DB_NAME || 'yarn_erp') + '_test',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    ...common
  },
  production: {
    use_env_variable: URL_ENV,
    ...common,
    dialectOptions: {
      // pg interprets boolean true as minimal SSL negotiation; object adds fine-grain opts
      ssl: process.env.PG_FORCE_SIMPLE_SSL === '1'
        ? true
        : { require: true, rejectUnauthorized: false }
    }
  }
};

if (process.env.DEBUG_SEQUELIZE_CONFIG === '1') {
  const env = process.env.NODE_ENV || 'development';
  const cfg = module.exports[env];
  // Avoid double protocol (sometimes user mistakenly prefixes postgres:// twice)
  const clean = resolved ? resolved.replace(/^postgresql:\/\/postgres:\/\//, 'postgresql://') : null;
  const masked = clean ? clean.replace(/:[^:@/]*@/, '://***@') : `${cfg.username}@${cfg.host}:${cfg.port}/${cfg.database}`;
  const sslVal = cfg.dialectOptions && cfg.dialectOptions.ssl;
  console.log('[SequelizeConfig] env=%s using=%s ssl=%j', env, masked, sslVal);
  if (env === 'production') {
    console.log('[SequelizeConfig] PG_FORCE_SIMPLE_SSL=%s', process.env.PG_FORCE_SIMPLE_SSL || '');
    if (clean && /localhost|127\.0\.0\.1/.test(clean) && process.env.ALLOW_LOCAL_PROD_DB !== '1') {
      console.warn('[SequelizeConfig] WARNING: Production config points to a local host. Set ALLOW_LOCAL_PROD_DB=1 to silence.');
    }
  }
}
