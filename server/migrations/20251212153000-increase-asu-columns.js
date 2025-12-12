'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Increase precision for mains_reading (from 10,2 -> 20,2)
        await queryInterface.sequelize.query('ALTER TABLE asu_production_entries ALTER COLUMN mains_reading TYPE DECIMAL(20, 2);');

        // Increase precision for efficiency (from 5,2 -> 10,2) to prevent overflow on weird calculations
        await queryInterface.sequelize.query('ALTER TABLE asu_production_entries ALTER COLUMN efficiency TYPE DECIMAL(10, 2);');

        // Increase actual_production precision
        await queryInterface.sequelize.query('ALTER TABLE asu_production_entries ALTER COLUMN actual_production TYPE DECIMAL(15, 2);');

        // Increase theoretical_production precision
        await queryInterface.sequelize.query('ALTER TABLE asu_production_entries ALTER COLUMN theoretical_production TYPE DECIMAL(15, 5);');

        // Increase production_at_100 precision
        await queryInterface.sequelize.query('ALTER TABLE asu_production_entries ALTER COLUMN production_at_100 TYPE DECIMAL(15, 5);');
    },

    async down(queryInterface, Sequelize) {
        // Reverting is risky as we might lose data if it's too large, but here's the attempt to revert to previous sizes

        // Note: This might fail if there is data that doesn't fit in the smaller types
        try {
            await queryInterface.sequelize.query('ALTER TABLE asu_production_entries ALTER COLUMN mains_reading TYPE DECIMAL(10, 2);');
            await queryInterface.sequelize.query('ALTER TABLE asu_production_entries ALTER COLUMN efficiency TYPE DECIMAL(5, 2);');
            await queryInterface.sequelize.query('ALTER TABLE asu_production_entries ALTER COLUMN actual_production TYPE DECIMAL(10, 2);');
            await queryInterface.sequelize.query('ALTER TABLE asu_production_entries ALTER COLUMN theoretical_production TYPE DECIMAL(12, 5);');
            await queryInterface.sequelize.query('ALTER TABLE asu_production_entries ALTER COLUMN production_at_100 TYPE DECIMAL(12, 5);');
        } catch (e) {
            console.warn('Migration down skipped or failed: Data might be too large to fit back into smaller columns.');
        }
    }
};
