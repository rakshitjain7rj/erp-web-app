const { sequelize } = require('./server/config/postgres');

async function checkTableStructure() {
  try {
    // Connect to the database
    await sequelize.authenticate();
    console.log('✅ Database connection successful');

    // Check if the table exists
    const tableExists = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'asu_production_entries'
      );
    `, { plain: true });

    console.log('Table exists?', tableExists.exists);

    // Get column information
    const columns = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'asu_production_entries'
      ORDER BY ordinal_position;
    `);

    console.log('Table columns:');
    columns[0].forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });

    // Check if unit column exists specifically
    const unitColumnExists = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'asu_production_entries' 
        AND column_name = 'unit'
      );
    `, { plain: true });

    console.log('Unit column exists?', unitColumnExists.exists);

    // Close the connection
    await sequelize.close();
  } catch (error) {
    console.error('Error checking table structure:', error);
  }
}

checkTableStructure();
