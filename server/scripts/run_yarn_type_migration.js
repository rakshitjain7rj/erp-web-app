const fs = require('fs');
const path = require('path');
const { sequelize } = require('./config/postgres');

// Function to run the migration
async function runMigration() {
  try {
    console.log('Starting migration to add yarn_type column to asu_production_entries table...');
    
    // Check if the column already exists to prevent errors
    const checkColumnQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'asu_production_entries'
      AND column_name = 'yarn_type';
    `;
    
    const [columnResult] = await sequelize.query(checkColumnQuery);
    
    if (columnResult.length > 0) {
      console.log('yarn_type column already exists, skipping migration');
      return;
    }
    
    // Read the SQL file content
    const sqlFilePath = path.join(__dirname, '../add_yarn_type_to_production_entries.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .replace(/--.*$/gm, '') // Remove comments
      .split(';')
      .filter(stmt => stmt.trim().length > 0);
    
    // Execute each statement in a transaction
    await sequelize.transaction(async (t) => {
      for (const statement of statements) {
        console.log(`Executing SQL: ${statement.trim().substring(0, 100)}...`);
        await sequelize.query(statement, { transaction: t });
      }
    });
    
    console.log('Migration completed successfully!');
    console.log('yarn_type column has been added to asu_production_entries table.');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    await sequelize.close();
  }
}

// Run the migration
runMigration();
