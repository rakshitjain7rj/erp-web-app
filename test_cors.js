const http = require('http');

// Test GET from port 5179 perspective
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/dyeing-firms',
  method: 'GET',
  headers: {
    'Origin': 'http://localhost:5179',
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log('GET Status from 5179:', res.statusCode);
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('GET Response from 5179:', data);
  });
});

req.on('error', (e) => {
  console.error('GET Error from 5179:', e.message);
});

req.end();
