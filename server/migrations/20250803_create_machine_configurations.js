'use strict';
/**
 * Create machine_configurations table (idempotent) with indexes.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const [[{ reg }]] = await queryInterface.sequelize.query(`SELECT to_regclass('public.machine_configurations') AS reg`);
    if (reg) {
      console.log('[migrate] machine_configurations already exists, skipping creation');
      return;
    }

    await queryInterface.createTable('machine_configurations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      machine_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      spindle_count: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      yarn_type: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: 'Cotton'
      },
      production_at_100: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('CURRENT_TIMESTAMP')
      },
      saved_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.fn('CURRENT_DATE')
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      }
    });

    await queryInterface.addIndex('machine_configurations', ['machine_id'], { name: 'idx_machine_configurations_machine_id' });
    await queryInterface.addIndex('machine_configurations', ['start_date', 'end_date'], { name: 'idx_machine_configurations_dates' });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "machine_configurations" CASCADE');
  }
};
