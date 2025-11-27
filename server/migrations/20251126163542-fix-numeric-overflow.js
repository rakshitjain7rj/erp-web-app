'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.query('ALTER TABLE asu_production_entries ALTER COLUMN mains_reading TYPE DECIMAL(20, 2);');
    await queryInterface.sequelize.query('ALTER TABLE asu_production_entries ALTER COLUMN efficiency TYPE DECIMAL(10, 2);');
    await queryInterface.sequelize.query('ALTER TABLE asu_production_entries ALTER COLUMN actual_production TYPE DECIMAL(15, 2);');
  },

  async down (queryInterface, Sequelize) {
    // Reverting might fail if data exceeds original limits, but here is the attempt
    await queryInterface.sequelize.query('ALTER TABLE asu_production_entries ALTER COLUMN mains_reading TYPE DECIMAL(10, 2);');
    await queryInterface.sequelize.query('ALTER TABLE asu_production_entries ALTER COLUMN efficiency TYPE DECIMAL(5, 2);');
    await queryInterface.sequelize.query('ALTER TABLE asu_production_entries ALTER COLUMN actual_production TYPE DECIMAL(10, 2);');
  }
};
