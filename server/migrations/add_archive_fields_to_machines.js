const { DataTypes } = require('sequelize');

/** @type {import('sequelize').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('asu_machines').catch(() => null);
    if (!table) {
      console.log('[migrate] asu_machines missing; skipping archive/status column additions');
      return;
    }
    if (!table.archived_at) {
      await queryInterface.addColumn('asu_machines', 'archived_at', {
        type: DataTypes.DATE,
        allowNull: true
      });
    } else {
      console.log('[migrate] archived_at already exists; skipping');
    }

    if (!table.status) {
      await queryInterface.addColumn('asu_machines', 'status', {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'ACTIVE'
      });
    } else {
      console.log('[migrate] status already exists; skipping');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('asu_machines', 'archived_at');
    await queryInterface.removeColumn('asu_machines', 'status');
  }
};
