const { sequelize } = require('../../config/postgres');
const Inventory = require('../../models/InventoryPostgres');

async function syncDatabase() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established.');
    console.log('🔄 Syncing Inventory model...');
    await Inventory.sync({ alter: true });
    console.log('✅ Inventory model synced.');
    const count = await Inventory.count();
    console.log(`📊 Inventory items: ${count}`);
    if (count > 0) {
      const sample = await Inventory.findOne({ order: [['createdAt', 'DESC']] });
      console.log(JSON.stringify(sample?.toJSON(), null, 2));
    }
    process.exit(0);
  } catch (error) {
    console.error('❌ Database sync failed:', error);
    process.exit(1);
  }
}

syncDatabase();
