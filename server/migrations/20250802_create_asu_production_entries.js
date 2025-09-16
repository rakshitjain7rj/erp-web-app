'use strict';

/**
 * Create asu_production_entries table with indexes & unique constraint.
 * Idempotent: skips if table already exists.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const [[{ reg }]] = await queryInterface.sequelize.query(`SELECT to_regclass('public.asu_production_entries') AS reg`);
    if (reg) {
      console.log('[migrate] asu_production_entries already exists, skipping creation');
      return;
    }

    await queryInterface.createTable('asu_production_entries', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      unit: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      machine_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      shift: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      actual_production: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      theoretical_production: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      efficiency: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      production_at_100: {
        type: Sequelize.DECIMAL(12, 5), // optional later precision upgrade
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('asu_production_entries', ['date', 'unit', 'machine_number'], { name: 'idx_asu_production_entries_date_unit_machine' });
    await queryInterface.addIndex('asu_production_entries', ['unit'], { name: 'idx_asu_production_entries_unit' });
    await queryInterface.addIndex('asu_production_entries', ['date'], { name: 'idx_asu_production_entries_date' });
    await queryInterface.addIndex('asu_production_entries', ['shift'], { name: 'idx_asu_production_entries_shift' });
    await queryInterface.addIndex('asu_production_entries', ['machine_number'], { name: 'idx_asu_production_entries_machine_number' });

    try {
      await queryInterface.addConstraint('asu_production_entries', {
        fields: ['unit', 'machine_number', 'date', 'shift'],
        type: 'unique',
        name: 'unique_unit_machine_date_shift'
      });
    } catch (err) {
      if (!/duplicate|exists/i.test(err.message)) throw err;
      console.log('[migrate] unique_unit_machine_date_shift already exists, continuing');
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "asu_production_entries" CASCADE');
  }
};
