'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Change count column from INTEGER to DECIMAL(12,5)
    await queryInterface.changeColumn('asu_machines', 'count', {
      type: Sequelize.DECIMAL(12, 5),
      allowNull: false,
      defaultValue: 0.00,
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert back to INTEGER
    await queryInterface.changeColumn('asu_machines', 'count', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  }
};
