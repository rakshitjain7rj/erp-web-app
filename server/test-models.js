const { sequelize } = require('./config/postgres');
const ProductionJob = require('./models/ProductionJob');
const Machine = require('./models/Machine');

async function testModels() {
  try {
    console.log('🔗 Testing PostgreSQL connection...');
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection successful');

    console.log('🏗️  Testing model creation...');
    
    // Test machine creation
    const testMachine = await Machine.create({
      machineId: 'TEST001',
      name: 'Test Machine',
      type: 'dyeing',
      status: 'active',
      capacity: 500,
      location: 'Test Floor'
    });
    console.log('✅ Machine created:', testMachine.machineId);

    // Test production job creation
    const testJob = await ProductionJob.create({
      jobId: 'PJ202601-TEST',
      productType: 'Cotton Yarn',
      quantity: 100,
      unit: 'kg',
      machineId: testMachine.id,
      priority: 'medium',
      status: 'pending'
    });
    console.log('✅ Production job created:', testJob.jobId);

    // Clean up test data
    await testJob.destroy();
    await testMachine.destroy();
    console.log('✅ Test data cleaned up');

    console.log('🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sequelize.close();
  }
}

testModels();
