'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('asu_production_entries');

    if (tableDescription.mains_reading) {
      await queryInterface.sequelize.query('ALTER TABLE asu_production_entries ALTER COLUMN mains_reading TYPE DECIMAL(20, 2);');
    } else {
      await queryInterface.addColumn('asu_production_entries', 'mains_reading', {
        type: Sequelize.DECIMAL(20, 2),
        allowNull: true
      });
    }

    if (tableDescription.efficiency) {
      await queryInterface.sequelize.query('ALTER TABLE asu_production_entries ALTER COLUMN efficiency TYPE DECIMAL(10, 2);');
    } else {
      // Should exist, but just in case
      await queryInterface.addColumn('asu_production_entries', 'efficiency', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      });
    }

    if (tableDescription.actual_production) {
      await queryInterface.sequelize.query('ALTER TABLE asu_production_entries ALTER COLUMN actual_production TYPE DECIMAL(15, 2);');
    } else {
      await queryInterface.addColumn('asu_production_entries', 'actual_production', {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('asu_production_entries');

    // Reverting might fail if data exceeds original limits, but here is the attempt
    if (tableDescription.mains_reading) {
      await queryInterface.sequelize.query('ALTER TABLE asu_production_entries ALTER COLUMN mains_reading TYPE DECIMAL(10, 2);');
    } else {
      await queryInterface.removeColumn('asu_production_entries', 'mains_reading');
    }

    if (tableDescription.efficiency) {
      await queryInterface.sequelize.query('ALTER TABLE asu_production_entries ALTER COLUMN efficiency TYPE DECIMAL(5, 2);');
    }

    if (tableDescription.actual_production) {
      await queryInterface.sequelize.query('ALTER TABLE asu_production_entries ALTER COLUMN actual_production TYPE DECIMAL(10, 2);');
    }
  }
};
