'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add yarn_type column if it doesn't exist
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS(
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'asu_machines'
          AND column_name = 'yarn_type'
        ) THEN
          ALTER TABLE asu_machines
          ADD COLUMN yarn_type VARCHAR(255) NOT NULL DEFAULT 'Cotton';
          
          RAISE NOTICE 'Added yarn_type column to asu_machines table';
        ELSE
          RAISE NOTICE 'yarn_type column already exists in asu_machines table';
        END IF;
      END $$;
    `);

    // Verify that count column exists and has the correct properties
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS(
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'asu_machines'
          AND column_name = 'count'
        ) THEN
          ALTER TABLE asu_machines
          ADD COLUMN count INTEGER NOT NULL DEFAULT 0;
          
          RAISE NOTICE 'Added count column to asu_machines table';
        ELSE
          -- Ensure count column has the correct properties
          ALTER TABLE asu_machines
          ALTER COLUMN count SET NOT NULL,
          ALTER COLUMN count SET DEFAULT 0;
          
          RAISE NOTICE 'Verified count column properties in asu_machines table';
        END IF;
      END $$;
    `);

    // Update existing records to set default values
    await queryInterface.sequelize.query(`
      UPDATE asu_machines
      SET yarn_type = 'Cotton'
      WHERE yarn_type IS NULL;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the yarn_type column if needed
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF EXISTS(
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'asu_machines'
          AND column_name = 'yarn_type'
        ) THEN
          ALTER TABLE asu_machines
          DROP COLUMN yarn_type;
          
          RAISE NOTICE 'Removed yarn_type column from asu_machines table';
        END IF;
      END $$;
    `);

    // Note: We don't remove the count column in the down migration since it's a core field
  }
};
