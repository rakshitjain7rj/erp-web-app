// Quick fix script - run this to add missing columns to machine_configurations table
// Usage: curl -X POST http://localhost:5000/api/admin/fix-machine-config-table

const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/postgres');

router.post('/fix-machine-config-table', async (req, res) => {
    try {
        console.log('Fixing machine_configurations table...');

        // Check if table exists
        const [[tableExists]] = await sequelize.query(`
      SELECT to_regclass('public.machine_configurations') AS reg
    `);

        if (!tableExists.reg) {
            // Create the table if it doesn't exist
            await sequelize.query(`
        CREATE TABLE machine_configurations (
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

            await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_machine_configurations_machine_id 
        ON machine_configurations(machine_id)
      `);

            await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_machine_configurations_dates 
        ON machine_configurations(start_date, end_date)
      `);

            return res.json({
                success: true,
                message: 'Created machine_configurations table with all columns'
            });
        }

        // Get existing columns
        const [columns] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'machine_configurations'
    `);

        const existingColumns = columns.map(c => c.column_name);
        const addedColumns = [];

        // Add missing columns
        if (!existingColumns.includes('spindle_count')) {
            await sequelize.query(`
        ALTER TABLE machine_configurations 
        ADD COLUMN spindle_count INTEGER NOT NULL DEFAULT 0
      `);
            addedColumns.push('spindle_count');
        }

        if (!existingColumns.includes('production_at_100')) {
            await sequelize.query(`
        ALTER TABLE machine_configurations 
        ADD COLUMN production_at_100 DECIMAL(12, 5) NOT NULL DEFAULT 0
      `);
            addedColumns.push('production_at_100');
        }

        if (!existingColumns.includes('start_date')) {
            await sequelize.query(`
        ALTER TABLE machine_configurations 
        ADD COLUMN start_date DATE NOT NULL DEFAULT CURRENT_DATE
      `);
            addedColumns.push('start_date');
        }

        if (!existingColumns.includes('end_date')) {
            await sequelize.query(`
        ALTER TABLE machine_configurations 
        ADD COLUMN end_date DATE
      `);
            addedColumns.push('end_date');
        }

        // Verify final columns
        const [finalColumns] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'machine_configurations' 
      ORDER BY column_name
    `);

        res.json({
            success: true,
            message: addedColumns.length > 0
                ? `Added columns: ${addedColumns.join(', ')}`
                : 'All columns already exist',
            addedColumns,
            allColumns: finalColumns.map(c => `${c.column_name} (${c.data_type})`)
        });
    } catch (err) {
        console.error('Error fixing machine_configurations table:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

module.exports = router;
