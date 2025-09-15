'use strict';
/**
 * Add additional inventory fields if not present (idempotent).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check table exists first
    const [[{ reg }]] = await queryInterface.sequelize.query(`SELECT to_regclass('public.inventories') AS reg`);
    if (!reg) {
      console.warn('[migrate] inventories table not found; skipping field additions');
      return;
    }

    const tableDesc = await queryInterface.describeTable('inventories');

    const addColumnIfMissing = async (name, spec) => {
      if (!tableDesc[name]) {
        await queryInterface.addColumn('inventories', name, spec);
      }
    };

    await addColumnIfMissing('currentQuantity', { type: Sequelize.DECIMAL(10,2), allowNull: true });
    await addColumnIfMissing('gsm', { type: Sequelize.DECIMAL(10,2), allowNull: true });
    await addColumnIfMissing('totalValue', { type: Sequelize.DECIMAL(10,2), allowNull: true });
    await addColumnIfMissing('warehouseLocation', { type: Sequelize.STRING(255), allowNull: true });
    await addColumnIfMissing('batchNumber', { type: Sequelize.STRING(255), allowNull: true });
    await addColumnIfMissing('supplierName', { type: Sequelize.STRING(255), allowNull: true });
    await addColumnIfMissing('manualQuantity', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
    await addColumnIfMissing('manualValue', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
    await addColumnIfMissing('manualYarn', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
    await addColumnIfMissing('remarks', { type: Sequelize.TEXT, allowNull: true });

    // Ensure boolean defaults applied to existing rows (only if columns exist now)
    await queryInterface.sequelize.query(`UPDATE inventories
      SET "manualQuantity" = COALESCE("manualQuantity", false),
          "manualValue" = COALESCE("manualValue", false),
          "manualYarn" = COALESCE("manualYarn", false)`);
  },
  async down(queryInterface) {
    const [[{ reg }]] = await queryInterface.sequelize.query(`SELECT to_regclass('public.inventories') AS reg`);
    if (!reg) return;
    const tableDesc = await queryInterface.describeTable('inventories');

    const dropIfExists = async (col) => { if (tableDesc[col]) await queryInterface.removeColumn('inventories', col); };

    await dropIfExists('currentQuantity');
    await dropIfExists('gsm');
    await dropIfExists('totalValue');
    await dropIfExists('warehouseLocation');
    await dropIfExists('batchNumber');
    await dropIfExists('supplierName');
    await dropIfExists('manualQuantity');
    await dropIfExists('manualValue');
    await dropIfExists('manualYarn');
    await dropIfExists('remarks');
  }
};
