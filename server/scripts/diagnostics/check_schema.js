const { sequelize } = require('../config/postgres');

async function checkSchema() {
  try {
    const [rows] = await sequelize.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'asu_machines'"
    );
    console.table(rows);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

checkSchema();
