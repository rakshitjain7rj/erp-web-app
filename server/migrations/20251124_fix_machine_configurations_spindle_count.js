'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const tableInfo = await queryInterface.describeTable('machine_configurations');

        if (!tableInfo.spindle_count) {
            console.log('Adding spindle_count column to machine_configurations table');
            await queryInterface.addColumn('machine_configurations', 'spindle_count', {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            });
        }
    },

    async down(queryInterface, Sequelize) {
        const tableInfo = await queryInterface.describeTable('machine_configurations');

        if (tableInfo.spindle_count) {
            await queryInterface.removeColumn('machine_configurations', 'spindle_count');
        }
    }
};
