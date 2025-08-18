const http = require('http');

console.log('🧪 Testing Dyeing API endpoints...');

// Test GET /api/dyeing (fetch all dyeing records)
const testGet = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/dyeing',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('📊 GET /api/dyeing Status:', res.statusCode);
        console.log('📊 GET Response:', data);
        resolve({ status: res.statusCode, data: data });
      });
    });

    req.on('error', (e) => {
      console.error('❌ GET Error:', e.message);
      reject(e);
    });

    req.end();
  });
};

// Test POST /api/dyeing (create new dyeing record)
const testPost = () => {
  return new Promise((resolve, reject) => {
    const testData = {
      yarnType: "Cotton",
      sentDate: new Date().toISOString().split('T')[0],
      expectedArrivalDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      remarks: "Test dyeing order",
      partyName: "Test Customer",
      quantity: 10,
      shade: "Blue",
      count: "20s",
      lot: "LOT-TEST-" + Date.now(),
      dyeingFirm: "Test Firm"
    };

    const postData = JSON.stringify(testData);

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/dyeing',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('📝 POST /api/dyeing Status:', res.statusCode);
        console.log('📝 POST Response:', data);
        resolve({ status: res.statusCode, data: data });
      });
    });

    req.on('error', (e) => {
      console.error('❌ POST Error:', e.message);
      reject(e);
    });

    req.write(postData);
    req.end();
  });
};

// Run tests
async function runTests() {
  try {
    console.log('1️⃣ Testing GET /api/dyeing...');
    await testGet();
    
    console.log('\n2️⃣ Testing POST /api/dyeing...');
    await testPost();
    
    console.log('\n✅ API tests completed!');
  } catch (error) {
    console.error('❌ API tests failed:', error);
  }
}

runTests();
