'use strict';

/**
 * Create asu_machines table with indexes & unique constraint.
 * Idempotent: skips if table already exists.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Guard: skip if table already exists
    const [[{ reg }]] = await queryInterface.sequelize.query(`SELECT to_regclass('public.asu_machines') AS reg`);
    if (reg) {
      console.log('[migrate] asu_machines already exists, skipping creation');
      return;
    }

    await queryInterface.createTable('asu_machines', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      machine_no: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      spindles: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      speed: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      production_at_100: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      unit: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: { min: 1, max: 2 },
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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

    // Indexes
    await queryInterface.addIndex('asu_machines', ['unit'], { name: 'idx_asu_machines_unit', unique: false });
    await queryInterface.addIndex('asu_machines', ['machine_no'], { name: 'idx_asu_machines_machine_no', unique: false });
    await queryInterface.addIndex('asu_machines', ['is_active'], { name: 'idx_asu_machines_active', unique: false });

    // Unique constraint (machine_no, unit)
    try {
      await queryInterface.addConstraint('asu_machines', {
        fields: ['machine_no', 'unit'],
        type: 'unique',
        name: 'unique_machine_no_per_unit'
      });
    } catch (err) {
      if (!/duplicate|exists/i.test(err.message)) throw err;
      console.log('[migrate] unique_machine_no_per_unit already exists, continuing');
    }
  },

  async down(queryInterface) {
    // Drop table if exists (raw for IF EXISTS safety)
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "asu_machines" CASCADE');
  }
};
