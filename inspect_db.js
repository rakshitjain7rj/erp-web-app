require('dotenv').config();
const { Sequelize } = require('sequelize');

// Log the database URI (with password masked for security)
const dbUri = process.env.POSTGRES_URI || 'No URI found in environment';
console.log('Database URI (masked):', dbUri.replace(/:[^:]*@/, ':****@'));

async function checkDatabase() {
  try {
    const sequelize = new Sequelize(process.env.POSTGRES_URI, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
      logging: false,
    });

    await sequelize.authenticate();
    console.log('✅ Database connection successful');

    // Check tables
    const tables = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('\nAvailable tables:');
    tables[0].forEach(t => console.log(`- ${t.table_name}`));
    
    // Check asu_production_entries if it exists
    const asuTableExists = tables[0].some(t => t.table_name === 'asu_production_entries');
    
    if (asuTableExists) {
      console.log('\nChecking asu_production_entries columns:');
      const columns = await sequelize.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'asu_production_entries'
        ORDER BY ordinal_position;
      `);
      
      columns[0].forEach(col => {
        console.log(`- ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
      });
      
      // Check sample data
      const sampleData = await sequelize.query(`
        SELECT * FROM asu_production_entries LIMIT 3;
      `);
      
      console.log('\nSample data from asu_production_entries:');
      console.log(JSON.stringify(sampleData[0], null, 2));
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.error(error.stack);
  }
}

checkDatabase();
