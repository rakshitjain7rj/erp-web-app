const { sequelize } = require('../config/postgres');

async function checkColumns() {
  try {
    const [results, metadata] = await sequelize.query(
      "SELECT column_name, data_type, numeric_precision, numeric_scale FROM information_schema.columns WHERE table_name = 'asu_production_entries';"
    );
    console.log('Columns in asu_production_entries:');
    console.table(results);
  } catch (error) {
    console.error('Error checking columns:', error);
  } finally {
    await sequelize.close();
  }
}

checkColumns();
