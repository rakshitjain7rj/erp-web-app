const { sequelize } = require('../config/postgres');

async function checkAndCreateTables() {
    console.log('🔍 Checking database tables...');
    
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection successful');
        
        // Check which tables exist
        const [tables] = await sequelize.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('DyeingFirms', 'CountProducts')
            ORDER BY table_name
        `);
        
        console.log('📊 Existing tables:', tables.map(t => t.table_name));
        
        // Create DyeingFirms table if it doesn't exist
        if (!tables.find(t => t.table_name === 'DyeingFirms')) {
            console.log('🔄 Creating DyeingFirms table...');
            await sequelize.query(`
                CREATE TABLE "DyeingFirms" (
                    "id" SERIAL PRIMARY KEY,
                    "name" VARCHAR(255) NOT NULL UNIQUE,
                    "isActive" BOOLEAN DEFAULT true,
                    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Insert default firms
            await sequelize.query(`
                INSERT INTO "DyeingFirms" ("name", "isActive") VALUES 
                    ('Rainbow Dyers', true),
                    ('Spectrum Colors', true),
                    ('Azure Dyeing Works', true),
                    ('Crimson Textile Dyers', true),
                    ('Prism Dyeing Co.', true),
                    ('Vibrant Colors Ltd.', true)
            `);
            
            console.log('✅ DyeingFirms table created with sample data');
        } else {
            console.log('ℹ️ DyeingFirms table already exists');
        }
        
        // Create CountProducts table if it doesn't exist
        if (!tables.find(t => t.table_name === 'CountProducts')) {
            console.log('🔄 Creating CountProducts table...');
            await sequelize.query(`
                CREATE TABLE "CountProducts" (
                    "id" SERIAL PRIMARY KEY,
                    "quantity" DECIMAL(10,2) NOT NULL,
                    "customerName" VARCHAR(255) NOT NULL,
                    "sentToDye" DECIMAL(10,2) DEFAULT 0,
                    "sentDate" DATE,
                    "receivedQuantity" DECIMAL(10,2) DEFAULT 0,
                    "receivedDate" DATE,
                    "dispatchQuantity" DECIMAL(10,2) DEFAULT 0,
                    "dispatchDate" DATE,
                    "dyeingFirm" VARCHAR(255) NOT NULL,
                    "partyName" VARCHAR(255),
                    "middleman" VARCHAR(255) DEFAULT 'Direct',
                    "grade" VARCHAR(10) DEFAULT 'A',
                    "remarks" TEXT,
                    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ CountProducts table created');
        } else {
            console.log('ℹ️ CountProducts table already exists');
        }
        
        // Final verification
        const [finalTables] = await sequelize.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('DyeingFirms', 'CountProducts')
            ORDER BY table_name
        `);
        
        console.log('🎉 Final verification - Available tables:', finalTables.map(t => t.table_name));
        
        // Check record counts
        for (const table of finalTables) {
            try {
                const [count] = await sequelize.query(`SELECT COUNT(*) as count FROM "${table.table_name}"`);
                console.log(`📈 ${table.table_name}: ${count[0].count} records`);
            } catch (error) {
                console.warn(`⚠️ Could not count ${table.table_name}:`, error.message);
            }
        }
        
        if (finalTables.length === 2) {
            console.log('🎯 SUCCESS! All required tables are now available');
            console.log('');
            console.log('✅ Tables created:');
            console.log('   - DyeingFirms ✓');
            console.log('   - CountProducts ✓');
            console.log('');
            console.log('🔄 Please restart your server to see the changes');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await sequelize.close();
    }
}

checkAndCreateTables().catch(console.error);
