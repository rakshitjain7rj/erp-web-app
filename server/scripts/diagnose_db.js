const { Sequelize } = require('sequelize');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const INIT_NODE_ENV = process.env.NODE_ENV || 'development';
const envFileSpecificEarly = path.resolve(__dirname, `../.env.${INIT_NODE_ENV}`);
const envFileDefaultEarly = path.resolve(__dirname, '../.env');

if (require('fs').existsSync(envFileSpecificEarly)) {
    dotenv.config({ path: envFileSpecificEarly });
    console.log(`Loaded ${envFileSpecificEarly}`);
} else if (require('fs').existsSync(envFileDefaultEarly)) {
    dotenv.config({ path: envFileDefaultEarly });
    console.log(`Loaded ${envFileDefaultEarly}`);
}

const DB_NAME = process.env.DB_NAME || 'yarn_erp';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'password';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;

console.log(`Config: Host=${DB_HOST}, Port=${DB_PORT}, User=${DB_USER}, DB=${DB_NAME}`);

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: 'postgres',
    logging: false,
});

async function checkConnection() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connection successful.');
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        if (error.original) {
            console.error('Original error code:', error.original.code);
            console.error('Original error address:', error.original.address);
            console.error('Original error port:', error.original.port);
        }
    } finally {
        await sequelize.close();
    }
}

checkConnection();
