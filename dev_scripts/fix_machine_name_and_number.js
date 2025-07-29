/**
 * Fix Machine Name and Number Issues
 * 
 * This script modifies the ASUMachine model to add machineName support
 * and ensures consistency between machine_name and machine_number fields
 */

const { sequelize } = require('../server/config/postgres');
const fs = require('fs');
const path = require('path');
const ASUMachine = require('../server/models/ASUMachine');

async function runMigration() {
  try {
    console.log('🚀 Starting machine name and number fix migration');
    
    // First, check if machineName field exists in the model
    const hasMachineNameField = !!ASUMachine.rawAttributes.machineName;
    console.log(`Machine model has machineName field: ${hasMachineNameField ? '✅ Yes' : '❌ No'}`);
    
    // If model doesn't have machineName, we need to add the column to the database
    if (!hasMachineNameField) {
      console.log('Adding machine_name column to database...');
      
      // Read and execute the SQL migration file
      const sqlPath = path.join(__dirname, 'add_machine_name_column.sql');
      
      if (!fs.existsSync(sqlPath)) {
        console.log('SQL migration file not found, creating it...');
        const migrationSQL = `
          -- Add machine_name column to asu_machines table
          ALTER TABLE asu_machines ADD COLUMN IF NOT EXISTS machine_name VARCHAR(255);
          
          -- Update existing entries to set machine_name based on machineNo
          UPDATE asu_machines SET machine_name = CONCAT('Machine ', machine_no) WHERE machine_name IS NULL;
          
          -- Create an index on machine_name
          CREATE INDEX IF NOT EXISTS idx_asu_machines_name ON asu_machines (machine_name);
        `;
        fs.writeFileSync(sqlPath, migrationSQL);
      }
      
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await sequelize.query(sql);
      console.log('✅ Added machine_name column to database');
    }
    
    // Now fix machine_number and machine_name inconsistencies
    console.log('Retrieving all machines...');
    const machines = await ASUMachine.findAll();
    console.log(`Found ${machines.length} machines`);
    
    let updatedCount = 0;
    
    // Update each machine to ensure consistency
    for (const machine of machines) {
      let needsUpdate = false;
      const updates = {};
      
      // If machineName is null or undefined, set it
      if (!machine.machineName) {
        updates.machineName = `Machine ${machine.machineNo}`;
        needsUpdate = true;
      }
      
      // If machine needs update, save it
      if (needsUpdate) {
        await machine.update(updates);
        updatedCount++;
      }
    }
    
    console.log(`✅ Fixed ${updatedCount} machines`);
    
    // Check database schema
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'asu_machines'
      ORDER BY ordinal_position;
    `);
    
    console.log('Current asu_machines table schema:');
    console.table(columns);
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the migration
runMigration();
