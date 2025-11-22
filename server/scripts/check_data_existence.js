const path = require('path');
const dotenv = require('dotenv');

// Mimic index.js environment loading
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

const { sequelize } = require('../config/postgres');
const ASUProductionEntry = require('../models/ASUProductionEntry');
const { Op } = require('sequelize');

async function checkData() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        const dateFrom = thirtyDaysAgo.toISOString().split('T')[0];
        const dateTo = today.toISOString().split('T')[0];

        console.log(`Checking data from ${dateFrom} to ${dateTo}`);

        const unit1Count = await ASUProductionEntry.count({
            where: {
                unit: 1,
                date: {
                    [Op.gte]: dateFrom
                }
            }
        });

        const unit2Count = await ASUProductionEntry.count({
            where: {
                unit: 2,
                date: {
                    [Op.gte]: dateFrom
                }
            }
        });

        console.log(`Unit 1 Entries (last 30 days): ${unit1Count}`);
        console.log(`Unit 2 Entries (last 30 days): ${unit2Count}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkData();
