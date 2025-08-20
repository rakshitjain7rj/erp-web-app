const { sequelize } = require('./server/config/postgres');
const Inventory = require('./server/models/InventoryPostgres');

async function syncDatabase() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    console.log('🔄 Syncing Inventory model...');
    await Inventory.sync({ alter: true }); // This will add missing columns
    console.log('✅ Inventory model synced successfully.');

    console.log('🔍 Checking current inventory items...');
    const count = await Inventory.count();
    console.log(`📊 Found ${count} inventory items in database.`);

    if (count > 0) {
      console.log('🔍 Sample inventory item:');
      const sample = await Inventory.findOne({
        order: [['createdAt', 'DESC']]
      });
      console.log(JSON.stringify(sample?.toJSON(), null, 2));
    }

    console.log('✅ Database sync completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database sync failed:', error);
    process.exit(1);
  }
}

syncDatabase();
