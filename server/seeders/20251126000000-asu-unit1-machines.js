/**
 * Seed ASU Unit 1 Machines (1-9)
 * 
 * This creates 9 pre-defined machines for ASU Unit 1.
 * Machines are fixed - only their configurations (count, yarn type, spindles, speed, prod@100) change.
 * 
 * Run with: npx sequelize-cli db:seed --seed 20251126000000-asu-unit1-machines.js
 * Or run all seeds: npx sequelize-cli db:seed:all
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const machines = [];
    
    // Create 9 machines for ASU Unit 1
    for (let i = 1; i <= 9; i++) {
      machines.push({
        machine_no: i,
        machine_name: `Machine ${i}`,
        count: 0,
        yarn_type: 'Cotton',
        spindles: 0,
        speed: 0,
        production_at_100: 0,
        unit: 1,
        is_active: true,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    // Check which machines already exist
    const existingMachines = await queryInterface.sequelize.query(
      'SELECT machine_no FROM asu_machines WHERE unit = 1',
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    const existingNos = existingMachines.map(m => m.machine_no);
    
    // Filter out machines that already exist
    const newMachines = machines.filter(m => !existingNos.includes(m.machine_no));
    
    if (newMachines.length === 0) {
      console.log('[ASU Unit 1 Machines Seed] All 9 machines already exist. Skipping.');
      return;
    }

    await queryInterface.bulkInsert('asu_machines', newMachines);
    console.log(`[ASU Unit 1 Machines Seed] Created ${newMachines.length} machines for ASU Unit 1.`);
  },

  down: async (queryInterface, Sequelize) => {
    // Only delete the seeded machines (1-9) for unit 1
    await queryInterface.bulkDelete('asu_machines', {
      unit: 1,
      machine_no: [1, 2, 3, 4, 5, 6, 7, 8, 9]
    });
    console.log('[ASU Unit 1 Machines Seed] Removed machines 1-9 for ASU Unit 1.');
  }
};
