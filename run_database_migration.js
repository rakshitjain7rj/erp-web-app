const fs = require('fs');
const path = require('path');

// Database setup - adjust these based on your environment
let db;
let isNeonDB = false;

async function connectToDatabase() {
    try {
        // Try to use existing database connection setup
        if (process.env.DATABASE_URL) {
            const { Pool } = require('pg');
            const pool = new Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
            });
            db = pool;
            isNeonDB = true;
            console.log('📊 Connected to PostgreSQL database');
        } else {
            // Fallback to local SQLite (if available)
            const Database = require('better-sqlite3');
            const dbPath = path.join(__dirname, 'data', 'erp.db');
            db = new Database(dbPath);
            console.log('📊 Connected to SQLite database');
        }
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }
}

async function createMissingTables() {
    console.log('🔄 Creating missing database tables...');
    
    try {
        if (isNeonDB) {
            // PostgreSQL/Neon DB
            const sqlFile = path.join(__dirname, 'create_missing_tables.sql');
            const sql = fs.readFileSync(sqlFile, 'utf8');
            
            // Split by semicolon and execute each statement
            const statements = sql.split(';').filter(stmt => stmt.trim());
            
            for (const statement of statements) {
                if (statement.trim()) {
                    try {
                        await db.query(statement);
                        console.log('✅ Executed SQL statement successfully');
                    } catch (error) {
                        if (error.message.includes('already exists')) {
                            console.log('ℹ️ Table already exists, skipping...');
                        } else {
                            console.warn('⚠️ SQL warning:', error.message);
                        }
                    }
                }
            }
            
            // Verify tables exist
            const result = await db.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_name IN ('DyeingFirms', 'CountProducts') 
                AND table_schema = 'public'
            `);
            
            console.log('📋 Created tables:', result.rows.map(r => r.table_name));
            
        } else {
            // SQLite
            const statements = [
                `CREATE TABLE IF NOT EXISTS DyeingFirms (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE,
                    isActive BOOLEAN DEFAULT 1,
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
                )`,
                `CREATE TABLE IF NOT EXISTS CountProducts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    quantity REAL NOT NULL,
                    customerName TEXT NOT NULL,
                    sentToDye REAL DEFAULT 0,
                    sentDate DATE,
                    receivedQuantity REAL DEFAULT 0,
                    receivedDate DATE,
                    dispatchQuantity REAL DEFAULT 0,
                    dispatchDate DATE,
                    dyeingFirm TEXT NOT NULL,
                    partyName TEXT,
                    middleman TEXT DEFAULT 'Direct',
                    grade TEXT DEFAULT 'A',
                    remarks TEXT,
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
                )`,
                `INSERT OR IGNORE INTO DyeingFirms (name, isActive) VALUES 
                    ('Rainbow Dyers', 1),
                    ('Spectrum Colors', 1),
                    ('Azure Dyeing Works', 1),
                    ('Crimson Textile Dyers', 1)`,
                `CREATE INDEX IF NOT EXISTS idx_dyeing_firms_name ON DyeingFirms (name)`,
                `CREATE INDEX IF NOT EXISTS idx_count_products_dyeing_firm ON CountProducts (dyeingFirm)`
            ];
            
            for (const statement of statements) {
                try {
                    db.exec(statement);
                    console.log('✅ Executed SQLite statement successfully');
                } catch (error) {
                    console.warn('⚠️ SQLite warning:', error.message);
                }
            }
        }
        
        console.log('🎉 Database tables created successfully!');
        
    } catch (error) {
        console.error('❌ Failed to create tables:', error);
        throw error;
    }
}

async function verifyTables() {
    console.log('🔍 Verifying tables...');
    
    try {
        if (isNeonDB) {
            // Check DyeingFirms table
            const firms = await db.query('SELECT COUNT(*) as count FROM "DyeingFirms"');
            console.log(`📊 DyeingFirms table: ${firms.rows[0].count} records`);
            
            // Check CountProducts table
            const products = await db.query('SELECT COUNT(*) as count FROM "CountProducts"');
            console.log(`📊 CountProducts table: ${products.rows[0].count} records`);
            
        } else {
            // SQLite verification
            const firms = db.prepare('SELECT COUNT(*) as count FROM DyeingFirms').get();
            console.log(`📊 DyeingFirms table: ${firms.count} records`);
            
            const products = db.prepare('SELECT COUNT(*) as count FROM CountProducts').get();
            console.log(`📊 CountProducts table: ${products.count} records`);
        }
        
        console.log('✅ All tables verified successfully!');
        
    } catch (error) {
        console.error('❌ Table verification failed:', error);
        throw error;
    }
}

async function main() {
    console.log('🚀 Starting database migration...');
    console.log('📅 Date:', new Date().toISOString());
    
    try {
        await connectToDatabase();
        await createMissingTables();
        await verifyTables();
        
        console.log('🎯 Migration completed successfully!');
        console.log('');
        console.log('Next steps:');
        console.log('1. Restart your server');
        console.log('2. Test the dyeing orders and count products features');
        console.log('3. Check that firms sync properly between pages');
        
    } catch (error) {
        console.error('💥 Migration failed:', error);
        process.exit(1);
    } finally {
        if (db) {
            if (isNeonDB) {
                await db.end();
            } else {
                db.close();
            }
            console.log('📊 Database connection closed');
        }
    }
}

// Run migration
main().catch(console.error);
