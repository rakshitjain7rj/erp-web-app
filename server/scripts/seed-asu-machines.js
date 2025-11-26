/**
 * Seed ASU Unit 1 Machines (1-9)
 * 
 * Run with: node scripts/seed-asu-machines.js
 * 
 * This creates 9 pre-defined machines for ASU Unit 1.
 * Machines are fixed - only their configurations change.
 */

const path = require('path');
// Load .env.development like the main server does
require('dotenv').config({ path: path.join(__dirname, '../.env.development') });
// Fallback to .env if .env.development doesn't exist
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { sequelize } = require('../config/postgres');

async function seedMachines() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connected successfully!\n');

    // Check which machines already exist
    const [existingMachines] = await sequelize.query(
      'SELECT machine_no FROM asu_machines WHERE unit = 1'
    );
    
    const existingNos = existingMachines.map(m => m.machine_no);
    console.log('Existing machines:', existingNos.length > 0 ? existingNos.join(', ') : 'none');

    // Create machines 1-9 that don't exist
    let created = 0;
    for (let i = 1; i <= 9; i++) {
      if (!existingNos.includes(i)) {
        await sequelize.query(`
          INSERT INTO asu_machines (machine_no, machine_name, count, yarn_type, spindles, speed, production_at_100, unit, is_active, status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        `, {
          bind: [i, `Machine ${i}`, 0, 'Cotton', 0, 0, 0, 1, true, 'ACTIVE']
        });
        console.log(`✓ Created Machine ${i}`);
        created++;
      } else {
        console.log(`- Machine ${i} already exists, skipping`);
      }
    }

    console.log(`\n✅ Done! Created ${created} new machines.`);
    console.log('Total machines for ASU Unit 1:', existingNos.length + created);

  } catch (error) {
    console.error('Error seeding machines:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seedMachines();
