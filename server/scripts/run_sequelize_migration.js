require('dotenv').config();
const { Sequelize } = require('sequelize');
const migration = require('../migrations/20250709_add_yarntype_count_columns_sequelize');

// Command line arguments
const args = process.argv.slice(2);
const shouldRevert = args.includes('--revert');

async function runSequelizeMigration() {
  try {
    console.log(`${shouldRevert ? 'Reverting' : 'Running'} Sequelize migration for yarn_type and count columns...`);
    
    // Create Sequelize instance using environment variables
    const sequelize = new Sequelize(process.env.POSTGRES_URI, {
      dialect: 'postgres',
      logging: console.log
    });
    
    // Test the connection
    await sequelize.authenticate();
    console.log('Connection to database has been established successfully.');
    
    // Run the migration
    if (shouldRevert) {
      await migration.down(sequelize.getQueryInterface(), Sequelize);
      console.log('Migration reverted successfully.');
    } else {
      await migration.up(sequelize.getQueryInterface(), Sequelize);
      console.log('Migration completed successfully.');
    }
    
    // Verify the columns
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'asu_machines'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nCurrent asu_machines table schema:');
    console.table(results);
    
    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error with migration:', error);
    process.exit(1);
  }
}

runSequelizeMigration();
