const http = require('http');

// Test creating a firm
function testCreateFirm() {
  const postData = JSON.stringify({ name: 'Test Firm' });
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/dyeing-firms',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('POST Status:', res.statusCode);
      console.log('POST Response:', data);
      
      // Now test getting firms
      testGetFirms();
    });
  });

  req.on('error', (err) => {
    console.log('POST Error:', err.message);
  });

  req.write(postData);
  req.end();
}

// Test getting firms
function testGetFirms() {
  http.get('http://localhost:5000/api/dyeing-firms', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('GET Status:', res.statusCode);
      console.log('GET Response:', data);
    });
  }).on('error', (err) => {
    console.log('GET Error:', err.message);
  });
}

// Clear cache and test customer names
console.log('🧹 Clearing cache...');
localStorage.clear();
sessionStorage.clear();

// Test API directly
console.log('📡 Testing count products API...');
fetch('/api/count-products')
  .then(response => response.json())
  .then(data => {
    console.log('📋 API Response:', data);
    
    const products = data.data || data;
    if (Array.isArray(products)) {
      console.log(`✅ Found ${products.length} products`);
      
      products.forEach((product, i) => {
        console.log(`${i+1}. ID: ${product.id}`);
        console.log(`   Customer Name: "${product.customerName}"`);
        console.log(`   Party Name: "${product.partyName}"`);
        console.log(`   Valid: ${!!product.customerName}`);
        console.log('---');
      });
    } else {
      console.log('❌ Products is not an array:', typeof products);
    }
  })
  .catch(error => {
    console.error('❌ API Error:', error);
  });

console.log('✅ Test complete - reload page to see fresh data');
testCreateFirm();
