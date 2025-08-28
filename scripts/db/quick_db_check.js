// Quick database check script
const { sequelize } = require('./server/config/postgres');

async function checkData() {
  try {
    console.log('🔍 CHECKING CUSTOMER NAMES');
    
    const [results] = await sequelize.query(`
      SELECT id, "customerName", "partyName" 
      FROM "CountProducts" 
      ORDER BY "createdAt" DESC 
      LIMIT 5;
    `);
    
    console.log('📋 Database Results:');
    results.forEach((row, i) => {
      console.log(`${i+1}. ID: ${row.id}, Customer: "${row.customerName}", Party: "${row.partyName}"`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkData();
