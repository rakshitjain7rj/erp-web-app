const { ASUProductionEntry, ASUMachine } = require('../../../models/ASUModels');

async function testData() {
  try {
    console.log('Testing ASU Production Entry data...');
    const entries = await ASUProductionEntry.findAll({
      where: { unit: 1 },
      limit: 5,
      order: [['date', 'DESC']],
      include: [{ model: ASUMachine, as: 'machine', attributes: ['id','machineNo','productionAt100','count','yarnType'] }]
    });
    console.log(`Found ${entries.length} entries`);
    if (entries.length > 0) {
      entries.forEach(entry => {
        console.log(`Entry ${entry.id}:`, {
          machineNumber: entry.machineNumber,
          date: entry.date,
          shift: entry.shift,
          actualProduction: entry.actualProduction,
          theoreticalProduction: entry.theoreticalProduction,
          efficiency: entry.efficiency,
          machine: entry.machine ? {
            id: entry.machine.id,
            machineNo: entry.machine.machineNo,
            productionAt100: entry.machine.productionAt100
          } : 'NO MACHINE DATA'
        });
      });
    } else {
      console.log('No entries found');
    }
    const machines = await ASUMachine.findAll({ where: { unit: 1 }, limit: 3 });
    console.log(`\nFound ${machines.length} machines`);
    machines.forEach(machine => {
      console.log(`Machine ${machine.id}:`, { machineNo: machine.machineNo, productionAt100: machine.productionAt100, count: machine.count, yarnType: machine.yarnType });
    });
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testData();
