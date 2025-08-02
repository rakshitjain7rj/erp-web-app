const { Sequelize } = require('sequelize');
require('dotenv').config();

// Initialize Sequelize
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

async function verifyDyeingFirmsTable() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // Check if DyeingFirms table exists
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'DyeingFirms'
    `);

    if (tables.length > 0) {
      console.log('✅ DyeingFirms table exists');
      
      // Check table structure
      const [columns] = await sequelize.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'DyeingFirms' 
        ORDER BY ordinal_position
      `);
      
      console.log('\n📋 Table structure:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });

      // Check data
      const [firms] = await sequelize.query('SELECT * FROM "DyeingFirms" ORDER BY id');
      console.log(`\n📊 Found ${firms.length} dyeing firms:`);
      firms.forEach(firm => {
        console.log(`  - ${firm.name} (Contact: ${firm.contactPerson || 'N/A'})`);
      });
    } else {
      console.log('❌ DyeingFirms table does not exist');
    }

  } catch (error) {
    console.error('Database verification failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

verifyDyeingFirmsTable();
