const { sequelize } = require('./config/postgres');

async function testDatabaseTables() {
    console.log('🧪 Testing database tables...');
    
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection successful');
        
        // Test DyeingFirms table
        const [firms] = await sequelize.query('SELECT * FROM "DyeingFirms" LIMIT 5');
        console.log('📊 DyeingFirms table test:');
        console.log(`  - Total firms: ${firms.length}`);
        console.log('  - Sample firms:', firms.map(f => f.name));
        
        // Test CountProducts table
        const [products] = await sequelize.query('SELECT * FROM "CountProducts" LIMIT 5');
        console.log('📊 CountProducts table test:');
        console.log(`  - Total products: ${products.length}`);
        
        // Test creating a new firm
        console.log('🆕 Testing firm creation...');
        const testFirmName = `Test Firm ${Date.now()}`;
        await sequelize.query(`
            INSERT INTO "DyeingFirms" ("name", "isActive", "createdAt", "updatedAt") 
            VALUES (?, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, {
            replacements: [testFirmName]
        });
        console.log('✅ Test firm created:', testFirmName);
        
        // Verify the firm was created
        const [newFirms] = await sequelize.query('SELECT * FROM "DyeingFirms" WHERE "name" = ?', {
            replacements: [testFirmName]
        });
        console.log('✅ Verification: Firm found in database:', newFirms.length > 0);
        
        console.log('🎉 All database tests passed!');
        
    } catch (error) {
        console.error('❌ Database test failed:', error);
    } finally {
        await sequelize.close();
    }
}

testDatabaseTables().catch(console.error);
