const { sequelize } = require('../config/postgres');

async function addColumns() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    
    try {
      await queryInterface.addColumn('asu_production_entries', 'worker_name', {
        type: 'VARCHAR(255)',
        allowNull: true
      });
      console.log('Added worker_name column');
    } catch (e) {
      console.log('worker_name column might already exist or error:', e.message);
    }

    try {
      await queryInterface.addColumn('asu_production_entries', 'mains_reading', {
        type: 'DECIMAL(10, 2)',
        allowNull: true
      });
      console.log('Added mains_reading column');
    } catch (e) {
      console.log('mains_reading column might already exist or error:', e.message);
    }

    console.log('Done adding columns');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addColumns();
