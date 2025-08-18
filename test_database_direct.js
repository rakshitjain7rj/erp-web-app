// Direct database test script
const { DataTypes, Sequelize } = require('sequelize');
require('dotenv').config({ path: './server/.env' });

async function testDatabase() {
    const sequelize = new Sequelize({
        database: process.env.POSTGRES_DB,
        username: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        host: process.env.POSTGRES_HOST,
        port: process.env.POSTGRES_PORT,
        dialect: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },
        logging: false
    });

    try {
        console.log('🔗 Connecting to database...');
        await sequelize.authenticate();
        console.log('✅ Connected successfully');

        // Test the CountProducts table directly
        console.log('\n🔍 Testing CountProducts table...');
        
        const [results] = await sequelize.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'CountProducts' 
            ORDER BY ordinal_position;
        `);
        
        console.log('Table schema:');
        console.table(results);
        
        // Check if sentQuantity column exists
        const sentQuantityColumn = results.find(col => col.column_name === 'sentQuantity');
        if (sentQuantityColumn) {
            console.log('✅ sentQuantity column exists:', sentQuantityColumn);
        } else {
            console.log('❌ sentQuantity column NOT found');
        }
        
        // Get sample data
        const [data] = await sequelize.query('SELECT * FROM "CountProducts" LIMIT 3;');
        console.log('\nSample data:');
        if (data.length > 0) {
            console.log('Number of records:', data.length);
            console.log('First record fields:', Object.keys(data[0]));
            console.log('First record:', data[0]);
        } else {
            console.log('No data found in table');
        }
        
    } catch (error) {
        console.error('❌ Database error:', error.message);
    } finally {
        await sequelize.close();
        console.log('🔌 Database connection closed');
    }
}

testDatabase();
