const { sequelize } = require('./config/postgres');

(async () => {
    try {
        console.log('Checking machine_configurations table...');

        // Check if table exists
        const [[tableExists]] = await sequelize.query(`
      SELECT to_regclass('public.machine_configurations') AS reg
    `);

        if (!tableExists.reg) {
            console.log('machine_configurations table does not exist. Creating it...');

            // Create the table with all required columns
            await sequelize.query(`
        CREATE TABLE IF NOT EXISTS machine_configurations (
          id SERIAL PRIMARY KEY,
          machine_id INTEGER NOT NULL REFERENCES asu_machines(id) ON DELETE CASCADE,
          spindle_count INTEGER NOT NULL DEFAULT 0,
          yarn_type VARCHAR(255) NOT NULL DEFAULT 'Cotton',
          production_at_100 DECIMAL(12, 5) NOT NULL DEFAULT 0,
          start_date DATE NOT NULL DEFAULT CURRENT_DATE,
          end_date DATE,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);

            console.log('Created machine_configurations table with all columns');
        } else {
            console.log('machine_configurations table exists. Checking for missing columns...');

            // Get existing columns
            const [columns] = await sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'machine_configurations'
      `);

            const existingColumns = columns.map(c => c.column_name);
            console.log('Existing columns:', existingColumns.join(', '));

            // Add missing columns
            if (!existingColumns.includes('spindle_count')) {
                console.log('Adding spindle_count column...');
                await sequelize.query(`
          ALTER TABLE machine_configurations 
          ADD COLUMN spindle_count INTEGER NOT NULL DEFAULT 0
        `);
                console.log('Added spindle_count column');
            }

            if (!existingColumns.includes('production_at_100')) {
                console.log('Adding production_at_100 column...');
                await sequelize.query(`
          ALTER TABLE machine_configurations 
          ADD COLUMN production_at_100 DECIMAL(12, 5) NOT NULL DEFAULT 0
        `);
                console.log('Added production_at_100 column');
            }

            if (!existingColumns.includes('start_date')) {
                console.log('Adding start_date column...');
                await sequelize.query(`
          ALTER TABLE machine_configurations 
          ADD COLUMN start_date DATE NOT NULL DEFAULT CURRENT_DATE
        `);
                console.log('Added start_date column');
            }

            if (!existingColumns.includes('end_date')) {
                console.log('Adding end_date column...');
                await sequelize.query(`
          ALTER TABLE machine_configurations ADD COLUMN end_date DATE
        `);
                console.log('Added end_date column');
            }
        }

        console.log('\\nAll columns are now in place. Verification:');
        const [finalColumns] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'machine_configurations' 
      ORDER BY column_name
    `);
        finalColumns.forEach(col => console.log(`  - ${col.column_name}: ${col.data_type}`));

        await sequelize.close();
        console.log('\\nDone!');
    } catch (err) {
        console.error('Error:', err.message);
        console.error(err);
        await sequelize.close();
        process.exit(1);
    }
})();
