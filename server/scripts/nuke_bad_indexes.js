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

async function nukeBadIndexes() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // 1. Find all indexes on asu_machines that involve machine_no and are UNIQUE, excluding the correct composite one
        const indexes = await sequelize.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'asu_machines'
      AND indexdef LIKE '%UNIQUE%'
      AND indexdef LIKE '%(machine_no)%'
      AND indexname != 'unique_unit_machine_no'
    `, { type: sequelize.QueryTypes.SELECT });

        console.log('Found suspicious unique indexes:', indexes);

        for (const idx of indexes) {
            console.log(`Dropping index: ${idx.indexname}`);
            // Try dropping as constraint first (in case it backs a constraint)
            try {
                await sequelize.query(`ALTER TABLE public.asu_machines DROP CONSTRAINT IF EXISTS "${idx.indexname}" CASCADE`);
                console.log(`Dropped constraint ${idx.indexname}`);
            } catch (e) {
                console.log(`Could not drop as constraint (might not be one): ${e.message}`);
            }

            // Then drop as index
            try {
                await sequelize.query(`DROP INDEX IF EXISTS "${idx.indexname}" CASCADE`);
                console.log(`Dropped index ${idx.indexname}`);
            } catch (e) {
                console.log(`Could not drop index: ${e.message}`);
            }
        }

        console.log('✅ Nuke complete.');

    } catch (error) {
        console.error('Error nuking indexes:', error);
    } finally {
        await sequelize.close();
    }
}

nukeBadIndexes();
