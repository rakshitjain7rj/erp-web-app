const fs = require('fs');
const path = require('path');
const { sequelize } = require('./server/config/postgres');

async function fixAsuUnitIssue() {
  try {
    console.log('🔗 Connecting to PostgreSQL...');
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection successful');

    // 1. Run the migration to add unit column if missing
    console.log('\n📝 Running SQL migration to fix unit column...');
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'server', 'migrations', '20240708_fix_unit_column.sql'),
      'utf8'
    );
    await sequelize.query(migrationSQL);
    console.log('✅ Migration executed successfully');

    // 2. Update the model file
    console.log('\n📄 Updating ASUProductionEntry model...');
    const newModelContent = fs.readFileSync(
      path.join(__dirname, 'server', 'models', 'ASUProductionEntry.js.new'),
      'utf8'
    );
    
    // Backup original file
    const modelPath = path.join(__dirname, 'server', 'models', 'ASUProductionEntry.js');
    fs.copyFileSync(modelPath, `${modelPath}.bak`);
    console.log('✅ Original model file backed up');
    
    // Write new model file
    fs.writeFileSync(modelPath, newModelContent);
    console.log('✅ ASUProductionEntry model updated');

    // 3. Update controller with fixed getProductionStats method
    console.log('\n📄 Updating asuUnit1Controller with fixed stats method...');
    const fixedController = fs.readFileSync(
      path.join(__dirname, 'server', 'controllers', 'asuUnit1Controller.js.fix'),
      'utf8'
    );
    
    const controllerPath = path.join(__dirname, 'server', 'controllers', 'asuUnit1Controller.js');
    
    // Read current controller file
    const currentController = fs.readFileSync(controllerPath, 'utf8');
    
    // Extract imports and other functions
    const regex = /const getProductionStats[\s\S]*?module\.exports/;
    const updatedController = currentController.replace(regex, fixedController);
    
    // Backup original file
    fs.copyFileSync(controllerPath, `${controllerPath}.bak`);
    console.log('✅ Original controller file backed up');
    
    // Write new controller file
    fs.writeFileSync(controllerPath, updatedController);
    console.log('✅ asuUnit1Controller updated');

    console.log('\n🎉 All fixes applied successfully!');
    console.log('Please restart your server now using the restart_server.bat script');

  } catch (error) {
    console.error('❌ Error applying fixes:', error);
  } finally {
    await sequelize.close();
  }
}

fixAsuUnitIssue();
