'use strict';

/** 
 * Migration to add/update yarn_type column in existing ASU machines table
 * This is for environments where ASU tables already exist
 */

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

    // Ensure count column has correct properties
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
          -- Ensure count column allows NULL temporarily to avoid constraint violations
          ALTER TABLE asu_machines
          ALTER COLUMN count DROP NOT NULL;
          
          -- Update any NULL values to 0
          UPDATE asu_machines SET count = 0 WHERE count IS NULL;
          
          -- Now set NOT NULL constraint and default
          ALTER TABLE asu_machines
          ALTER COLUMN count SET NOT NULL,
          ALTER COLUMN count SET DEFAULT 0;
          
          RAISE NOTICE 'Updated count column properties in asu_machines table';
        END IF;
      END $$;
    `);

    // Update existing records to set default yarn_type
    await queryInterface.sequelize.query(`
      UPDATE asu_machines
      SET yarn_type = 'Cotton'
      WHERE yarn_type IS NULL OR yarn_type = '';
    `);

    // Ensure production_at_100 column exists and has proper default
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS(
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'asu_machines'
          AND column_name = 'production_at_100'
        ) THEN
          ALTER TABLE asu_machines
          ADD COLUMN production_at_100 NUMERIC(10, 2) NOT NULL DEFAULT 0;
          
          RAISE NOTICE 'Added production_at_100 column to asu_machines table';
        ELSE
          -- Ensure existing column has proper default
          UPDATE asu_machines SET production_at_100 = 0 WHERE production_at_100 IS NULL;
          
          ALTER TABLE asu_machines
          ALTER COLUMN production_at_100 SET NOT NULL,
          ALTER COLUMN production_at_100 SET DEFAULT 0;
          
          RAISE NOTICE 'Updated production_at_100 column properties in asu_machines table';
        END IF;
      END $$;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Only remove yarn_type column, keep count and production_at_100 as they are core fields
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
  }
};
