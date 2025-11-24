const { sequelize } = require('./config/postgres');

(async () => {
    try {
        const [results] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'machine_configurations' 
      ORDER BY column_name
    `);

        console.log('Current columns in machine_configurations table:');
        results.forEach(col => console.log(' -', col.column_name, ':', col.data_type));

        await sequelize.close();
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
})();
