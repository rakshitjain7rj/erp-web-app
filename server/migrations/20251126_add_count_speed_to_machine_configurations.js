'use strict';
/**
 * Add count and speed columns to machine_configurations table for complete history tracking.
 * This allows tracking all machine configuration fields: count, yarn_type, spindles, speed, production_at_100
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Check if columns already exist
      const tableInfo = await queryInterface.describeTable('machine_configurations');
      
      // Add count column if it doesn't exist
      if (!tableInfo.count) {
        await queryInterface.addColumn('machine_configurations', 'count', {
          type: Sequelize.DECIMAL(12, 5),
          allowNull: true,
          defaultValue: 0
        }, { transaction });
        console.log('[migrate] Added count column to machine_configurations');
      } else {
        console.log('[migrate] count column already exists, skipping');
      }
      
      // Add speed column if it doesn't exist
      if (!tableInfo.speed) {
        await queryInterface.addColumn('machine_configurations', 'speed', {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: true,
          defaultValue: 0
        }, { transaction });
        console.log('[migrate] Added speed column to machine_configurations');
      } else {
        console.log('[migrate] speed column already exists, skipping');
      }
      
      await transaction.commit();
      console.log('[migrate] Successfully added count and speed columns');
    } catch (error) {
      await transaction.rollback();
      console.error('[migrate] Error adding columns:', error);
      throw error;
    }
  },
  
  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      const tableInfo = await queryInterface.describeTable('machine_configurations');
      
      if (tableInfo.count) {
        await queryInterface.removeColumn('machine_configurations', 'count', { transaction });
      }
      
      if (tableInfo.speed) {
        await queryInterface.removeColumn('machine_configurations', 'speed', { transaction });
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
