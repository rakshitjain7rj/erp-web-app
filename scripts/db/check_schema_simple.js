const CountProduct = require('./server/models/CountProduct');

async function checkSchema() {
  try {
    const described = await CountProduct.describe();
    console.log('CountProduct table schema:');
    console.log(JSON.stringify(described, null, 2));
    
    // Test fetching some data to see the actual fields
    const sampleData = await CountProduct.findOne();
    if (sampleData) {
      console.log('\nSample data fields:');
      console.log(Object.keys(sampleData.toJSON()));
    } else {
      console.log('\nNo data found in table');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkSchema();
