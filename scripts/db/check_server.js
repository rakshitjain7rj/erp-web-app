const http = require('http');

function testConnection() {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/test',
    method: 'GET',
    timeout: 3000
  };

  console.log('🔍 Checking if server is running on localhost:5000...');

  const req = http.request(options, (res) => {
    console.log(`✅ Server is running! Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📄 Response:', data);
      process.exit(0);
    });
  });

  req.on('error', (err) => {
    console.log('❌ Server not running or not accessible');
    console.log('🔧 Error:', err.message);
    console.log('\n💡 To start the server, run:');
    console.log('   cd server && npm start');
    console.log('   or');
    console.log('   node server/index.js');
    process.exit(1);
  });

  req.on('timeout', () => {
    console.log('⏰ Connection timeout - server may not be running');
    req.destroy();
    process.exit(1);
  });

  req.end();
}

testConnection();
