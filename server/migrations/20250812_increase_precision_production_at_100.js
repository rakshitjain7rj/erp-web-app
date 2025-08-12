'use strict';

/** 
 * @typedef {import('sequelize').QueryInterface} QueryInterface
 * @typedef {import('sequelize').Sequelize} Sequelize
 */

module.exports = {
  /**
   * Increase precision for production_at_100 and theoretical_production to 5 decimals
   * @param {QueryInterface} queryInterface
   * @param {Sequelize} Sequelize
   * @returns {Promise<void>}
   */
  async up(queryInterface, Sequelize) {
    // asu_machines.production_at_100 -> DECIMAL(12,5)
    await queryInterface.changeColumn('asu_machines', 'production_at_100', {
      type: Sequelize.DECIMAL(12, 5),
      allowNull: false,
      defaultValue: 0
    });

    // machine_configurations.production_at_100 -> DECIMAL(12,5)
    await queryInterface.changeColumn('machine_configurations', 'production_at_100', {
      type: Sequelize.DECIMAL(12, 5),
      allowNull: false,
      defaultValue: 0
    });

    // asu_production_entries.production_at_100 -> DECIMAL(12,5)
    await queryInterface.changeColumn('asu_production_entries', 'production_at_100', {
      type: Sequelize.DECIMAL(12, 5),
      allowNull: true
    });

    // asu_production_entries.theoretical_production -> DECIMAL(12,5)
    await queryInterface.changeColumn('asu_production_entries', 'theoretical_production', {
      type: Sequelize.DECIMAL(12, 5),
      allowNull: true
    });
  },

  /**
   * Revert precision back to 2 decimals
   * @param {QueryInterface} queryInterface
   * @param {Sequelize} Sequelize
   * @returns {Promise<void>}
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('asu_machines', 'production_at_100', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.changeColumn('machine_configurations', 'production_at_100', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.changeColumn('asu_production_entries', 'production_at_100', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    });

    await queryInterface.changeColumn('asu_production_entries', 'theoretical_production', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    });
  }
};
