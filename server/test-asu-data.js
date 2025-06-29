const { sequelize } = require('./config/postgres');
const {
  ASUDailyMachineData,
  ASUProductionEfficiency,
  ASUMainsReading,
  ASUWeeklyData
} = require('./models/ASUModels');

async function testASUData() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Test if tables exist and have data
    console.log('\n📊 Checking ASU tables...');

    const dailyCount = await ASUDailyMachineData.count();
    console.log(`Daily Machine Data records: ${dailyCount}`);

    const productionCount = await ASUProductionEfficiency.count();
    console.log(`Production Efficiency records: ${productionCount}`);

    const mainsCount = await ASUMainsReading.count();
    console.log(`Mains Reading records: ${mainsCount}`);

    const weeklyCount = await ASUWeeklyData.count();
    console.log(`Weekly Data records: ${weeklyCount}`);

    // Get some sample data
    if (dailyCount > 0) {
      console.log('\n📋 Sample Daily Machine Data:');
      const sampleDaily = await ASUDailyMachineData.findAll({ limit: 3 });
      sampleDaily.forEach(record => {
        console.log(`Machine ${record.machine}, Karigar: ${record.karigarName}, Date: ${record.date}`);
      });
    }

    if (productionCount > 0) {
      console.log('\n🏭 Sample Production Data:');
      const sampleProduction = await ASUProductionEfficiency.findAll({ limit: 3 });
      sampleProduction.forEach(record => {
        console.log(`Machine ${record.machine}, Production: ${record.kgsProduced} kg, Date: ${record.date}`);
      });
    }

    // Test raw query to see actual database structure
    console.log('\n🔍 Testing raw query...');
    const [results] = await sequelize.query('SELECT COUNT(*) as count FROM asu_daily_machine_data');
    console.log(`Raw query count: ${results[0].count}`);

    // Show table structure
    const [tableInfo] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'asu_daily_machine_data' 
      ORDER BY ordinal_position
    `);
    console.log('\n📝 Table structure:');
    tableInfo.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

testASUData();
