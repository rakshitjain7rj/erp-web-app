const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const INIT_NODE_ENV = process.env.NODE_ENV || 'development';
const envFileSpecificEarly = path.resolve(__dirname, `../.env.${INIT_NODE_ENV}`);
const envFileDefaultEarly = path.resolve(__dirname, '../.env');

if (require('fs').existsSync(envFileSpecificEarly)) {
    dotenv.config({ path: envFileSpecificEarly });
} else if (require('fs').existsSync(envFileDefaultEarly)) {
    dotenv.config({ path: envFileDefaultEarly });
}

const { sequelize } = require('../config/postgres');

async function inspectConstraints() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const constraints = await sequelize.query(`
      SELECT conname, contype, pg_get_constraintdef(c.oid) as definition
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'asu_machines'
    `, { type: sequelize.QueryTypes.SELECT });

        console.log('Constraints on asu_machines:', JSON.stringify(constraints, null, 2));

        const indexes = await sequelize.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'asu_machines'
    `, { type: sequelize.QueryTypes.SELECT });

        console.log('Indexes on asu_machines:', JSON.stringify(indexes, null, 2));

    } catch (error) {
        console.error('Error inspecting constraints:', error);
    } finally {
        await sequelize.close();
    }
}

inspectConstraints();
