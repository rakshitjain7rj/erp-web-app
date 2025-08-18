const path = require('path');
const fs = require('fs');

// Use the existing database configuration
const { sequelize } = require('../config/postgres');

async function runMigration() {
    console.log('🚀 Starting database migration for missing tables...');
    console.log('📅 Date:', new Date().toISOString());
    
    try {
        // Test connection first
        await sequelize.authenticate();
        console.log('✅ Database connection successful');
        
        // Read the migration SQL file
        const migrationPath = path.join(__dirname, '../migrations/20250110_create_dyeing_count_tables.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        console.log('📄 Migration file loaded successfully');
        
        // Split the SQL into individual statements (separated by semicolons)
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        console.log(`🔄 Executing ${statements.length} SQL statements...`);
        
        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.trim()) {
                try {
                    console.log(`📝 Executing statement ${i + 1}/${statements.length}...`);
                    await sequelize.query(statement);
                    console.log(`✅ Statement ${i + 1} executed successfully`);
                } catch (error) {
                    if (error.message.includes('already exists')) {
                        console.log(`ℹ️ Statement ${i + 1}: Object already exists, skipping...`);
                    } else {
                        console.warn(`⚠️ Statement ${i + 1} warning:`, error.message);
                    }
                }
            }
        }
        
        // Verify tables were created
        console.log('🔍 Verifying tables...');
        
        const [results] = await sequelize.query(`
            SELECT 
                table_name,
                table_schema
            FROM information_schema.tables 
            WHERE table_name IN ('DyeingFirms', 'CountProducts') 
            AND table_schema = 'public'
            ORDER BY table_name
        `);
        
        console.log('📊 Created tables:', results.map(r => r.table_name));
        
        // Check record counts
        for (const table of results) {
            try {
                const [countResult] = await sequelize.query(`SELECT COUNT(*) as count FROM "${table.table_name}"`);
                console.log(`📈 ${table.table_name}: ${countResult[0].count} records`);
            } catch (error) {
                console.warn(`⚠️ Could not count records in ${table.table_name}:`, error.message);
            }
        }
        
        if (results.length === 2) {
            console.log('🎉 Migration completed successfully!');
            console.log('');
            console.log('✅ All required tables created:');
            console.log('   - DyeingFirms table ✓');
            console.log('   - CountProducts table ✓');
            console.log('');
            console.log('📋 Next steps:');
            console.log('1. Restart your server');
            console.log('2. Test dyeing orders functionality');
            console.log('3. Verify firm synchronization between pages');
        } else {
            console.log('⚠️ Migration partially completed. Some tables may already exist.');
        }
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        console.error('💡 Error details:', {
            message: error.message,
            code: error.code,
            detail: error.detail
        });
        process.exit(1);
    } finally {
        await sequelize.close();
        console.log('📊 Database connection closed');
    }
}

// Run the migration
runMigration().catch(console.error);
