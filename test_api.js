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

console.log('Testing dyeing firms API...');
testCreateFirm();
