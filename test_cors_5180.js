const http = require('http');
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/dyeing-firms',
  method: 'GET',
  headers: {
    'Origin': 'http://localhost:5180',
    'Content-Type': 'application/json'
  }
};
const req = http.request(options, (res) => {
  console.log('Status from 5180:', res.statusCode);
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log('Response from 5180:', data));
});
req.on('error', (e) => console.error('Error from 5180:', e.message));
req.end();
