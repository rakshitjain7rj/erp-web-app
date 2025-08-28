// Quick script to fix CountProducts table schema
const { sequelize } = require('./server/config/postgres');
const CountProduct = require('./server/models/CountProduct');
const DyeingFirm = require('./server/models/DyeingFirm');

async function fixSchema() {
  try {
    console.log('🔧 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    console.log('🔄 Recreating CountProducts table with correct schema...');
    await CountProduct.sync({ force: true }); // This will drop and recreate the table
    console.log('✅ CountProducts table recreated');
    
    console.log('🔄 Recreating DyeingFirms table with correct schema...');
    await DyeingFirm.sync({ force: true }); // This will drop and recreate the table
    console.log('✅ DyeingFirms table recreated');
    
    console.log('✅ Schema fix complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Schema fix failed:', error);
    process.exit(1);
  }
}

fixSchema();
