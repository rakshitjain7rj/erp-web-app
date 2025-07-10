'use strict';

/** 
 * @typedef {import('sequelize').QueryInterface} QueryInterface
 * @typedef {import('sequelize').Sequelize} Sequelize
 */

module.exports = {
  /**
   * Migration to add yarn_type column to asu_machines table
   * @param {QueryInterface} queryInterface
   * @param {Sequelize} Sequelize
   * @returns {Promise<void>}
   */
  async up(queryInterface, Sequelize) {
    // Add yarn_type column if it doesn't exist
    await queryInterface.describeTable('asu_machines').then(async (tableDefinition) => {
      if (!tableDefinition.yarn_type) {
        await queryInterface.addColumn('asu_machines', 'yarn_type', {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'Cotton',
        });
        console.log('Added yarn_type column to asu_machines table');
      } else {
        console.log('yarn_type column already exists in asu_machines table');
      }
      
      // Ensure count column has correct properties
      if (tableDefinition.count) {
        await queryInterface.changeColumn('asu_machines', 'count', {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        });
        console.log('Updated count column properties in asu_machines table');
      } else {
        await queryInterface.addColumn('asu_machines', 'count', {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        });
        console.log('Added count column to asu_machines table');
      }
    });
    
    // Update existing records to set default values
    await queryInterface.sequelize.query(`
      UPDATE asu_machines
      SET yarn_type = 'Cotton'
      WHERE yarn_type IS NULL;
    `);
  },

  /**
   * Revert the migration
   * @param {QueryInterface} queryInterface
   * @param {Sequelize} Sequelize
   * @returns {Promise<void>}
   */
  async down(queryInterface, Sequelize) {
    // Remove the yarn_type column
    await queryInterface.describeTable('asu_machines').then(async (tableDefinition) => {
      if (tableDefinition.yarn_type) {
        await queryInterface.removeColumn('asu_machines', 'yarn_type');
        console.log('Removed yarn_type column from asu_machines table');
      }
      
      // Note: We don't revert the count column as it's a core field
    });
  }
};
