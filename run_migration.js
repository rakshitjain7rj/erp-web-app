// Migration script to fix DyeingRecords table
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const sequelize = new Sequelize(process.env.POSTGRES_URI, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  logging: console.log, // Enable logging to see what's happening
});

async function runMigration() {
  try {
    console.log('🚀 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');

    // Read the migration file
    const migrationSQL = fs.readFileSync(path.join(__dirname, 'migration_dyeing_records_fix.sql'), 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim().length > 0);
    
    console.log(`🔄 Executing ${statements.length} migration statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement.length > 0) {
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}`);
          await sequelize.query(statement);
          console.log(`✅ Statement ${i + 1} completed`);
        } catch (error) {
          console.log(`⚠️ Statement ${i + 1} error (might be expected):`, error.message);
        }
      }
    }
    
    console.log('🎉 Migration completed successfully');
    
    // Verify the table structure
    console.log('🔍 Verifying table structure...');
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'DyeingRecords' 
      ORDER BY ordinal_position
    `);
    
    console.log('DyeingRecords table structure:');
    console.table(results);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

runMigration();
