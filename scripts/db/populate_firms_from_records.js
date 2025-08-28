// Quick script to populate firms from existing dyeing records
const { Pool } = require('pg');

const pool = new Pool({
  user: 'neondb_owner',
  host: 'ep-old-snow-a85chxyu-pooler.eastus2.azure.neon.tech',
  database: 'neondb',
  password: 'npg_J0IkBnaKcHS6',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

async function extractAndCreateFirms() {
  try {
    console.log('🔍 Checking database tables...');
    
    // First, let's see what tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%dyeing%'
      ORDER BY table_name
    `);
    
    console.log('📋 Dyeing-related tables:', tablesResult.rows.map(t => t.table_name));
    
    // Let's also check for any table with records in the name
    const recordTablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name LIKE '%record%' OR table_name LIKE '%dyeing%')
      ORDER BY table_name
    `);
    
    console.log('📋 Record-related tables:', recordTablesResult.rows.map(t => t.table_name));
    
    // Now try to find firms in any of these tables
    for (const table of recordTablesResult.rows) {
      try {
        console.log(`🔍 Checking table: ${table.table_name}`);
        
        // Get column names first
        const columnsResult = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = $1 
          AND table_schema = 'public'
          ORDER BY ordinal_position
        `, [table.table_name]);
        
        const columns = columnsResult.rows.map(c => c.column_name);
        console.log(`  📋 Columns: ${columns.join(', ')}`);
        
        // Look for firm-related columns
        const firmColumns = columns.filter(c => 
          c.toLowerCase().includes('firm') || 
          c.toLowerCase().includes('company') ||
          c.toLowerCase().includes('vendor')
        );
        
        if (firmColumns.length > 0) {
          console.log(`  🏭 Found firm columns: ${firmColumns.join(', ')}`);
          
          // Get distinct values from the first firm column
          const firmColumn = firmColumns[0];
          const firmsResult = await pool.query(`
            SELECT DISTINCT "${firmColumn}" as firm_name, COUNT(*) as count
            FROM "${table.table_name}" 
            WHERE "${firmColumn}" IS NOT NULL 
            AND "${firmColumn}" != ''
            GROUP BY "${firmColumn}"
            ORDER BY count DESC, "${firmColumn}"
          `);
          
          if (firmsResult.rows.length > 0) {
            console.log(`  ✅ Found ${firmsResult.rows.length} unique firms:`, 
              firmsResult.rows.map(f => `${f.firm_name} (${f.count} records)`));
            
            // Store these firms for creation
            const firmsToCreate = firmsResult.rows.map(f => f.firm_name);
            
            // Check which firms already exist in DyeingFirms table
            const existingFirmsResult = await pool.query(`
              SELECT name FROM "DyeingFirms" 
              WHERE name = ANY($1)
            `, [firmsToCreate]);
            
            const alreadyExists = existingFirmsResult.rows.map(f => f.name);
            const toCreate = firmsToCreate.filter(name => !alreadyExists.includes(name));
            
            console.log('  ✅ Already exists:', alreadyExists);
            console.log('  🆕 Need to create:', toCreate);
            
            // Create missing firms
            for (const firmName of toCreate) {
              const result = await pool.query(`
                INSERT INTO "DyeingFirms" (name, "contactPerson", "isActive", "createdAt", "updatedAt")
                VALUES ($1, 'Manager', true, NOW(), NOW())
                RETURNING *
              `, [firmName]);
              
              console.log('  ✅ Created firm:', result.rows[0].name);
            }
          }
        }
        
      } catch (tableError) {
        console.log(`  ⚠️ Error checking table ${table.table_name}:`, tableError.message);
      }
    }
    
    // Show final count
    const finalCount = await pool.query('SELECT COUNT(*) FROM "DyeingFirms"');
    console.log('🎉 Total firms in database:', finalCount.rows[0].count);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

extractAndCreateFirms();
