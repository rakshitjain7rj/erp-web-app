require('dotenv').config();
const { sequelize } = require('../config/postgres');
const ASUMachine = require('../models/ASUMachine');

// Different yarn types to assign randomly to machines
const yarnTypes = ['Cotton', 'Polyester', 'Cotton/Polyester Blend', 'Viscose', 'Linen'];

async function updateMachinesWithYarnType() {
  try {
    console.log('Updating ASU Machines with yarn types...');
    
    // Get all machines
    const machines = await ASUMachine.findAll();
    console.log(`Found ${machines.length} machines to update`);
    
    // Update each machine with a random yarn type
    for (const machine of machines) {
      const randomYarnType = yarnTypes[Math.floor(Math.random() * yarnTypes.length)];
      
      // Update the machine
      await machine.update({ 
        yarnType: randomYarnType 
      });
      
      console.log(`Updated Machine ${machine.machineNo} with yarn type: ${randomYarnType}`);
    }
    
    console.log('Finished updating machines with yarn types');
    
    // Get updated machines to verify
    const updatedMachines = await ASUMachine.findAll({
      attributes: ['id', 'machineNo', 'count', 'yarnType']
    });
    
    console.log('\nUpdated machines:');
    console.table(updatedMachines.map(m => ({
      id: m.id,
      machineNo: m.machineNo,
      count: m.count,
      yarnType: m.yarnType
    })));
    
    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating machines:', error);
    process.exit(1);
  }
}

updateMachinesWithYarnType();
