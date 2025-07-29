const { DataTypes } = require('sequelize');

/** @type {import('sequelize').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('asu_machines', 'archived_at', {
      type: DataTypes.DATE,
      allowNull: true
    });
    
    await queryInterface.addColumn('asu_machines', 'status', {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'ACTIVE'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('asu_machines', 'archived_at');
    await queryInterface.removeColumn('asu_machines', 'status');
  }
};
