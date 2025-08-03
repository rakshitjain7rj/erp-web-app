/**
 * Server diagnostics script
 * Run this script to monitor server performance and detect issues
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const SERVER_URL = 'http://localhost:5000'; // Update this if your server runs on a different port
const ENDPOINTS = [
  '/api/test',
  '/health',
  '/api/debug-routes'
];
const LOG_DIR = path.join(__dirname, 'diagnostics');
const LOG_FILE = path.join(LOG_DIR, `server-diagnostics-${new Date().toISOString().split('T')[0]}.log`);

// Create log directory if it doesn't exist
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  console.log(`Created diagnostics directory at ${LOG_DIR}`);
}

// Initialize log file
fs.writeFileSync(LOG_FILE, `Server Diagnostics - ${new Date().toISOString()}\n\n`);

/**
 * Log a message to both console and file
 */
function log(message) {
  console.log(message);
  fs.appendFileSync(LOG_FILE, message + '\n');
}

/**
 * Make an HTTP request to the server
 */
function makeRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const url = `${SERVER_URL}${endpoint}`;
    log(`Testing endpoint: ${url}`);
    
    const startTime = Date.now();
    http.get(url, (res) => {
      const { statusCode } = res;
      const responseTime = Date.now() - startTime;
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({
            endpoint,
            statusCode,
            responseTime,
            data: parsedData
          });
        } catch (e) {
          resolve({
            endpoint,
            statusCode,
            responseTime,
            data: data.substring(0, 500) + '...' // Truncate long responses
          });
        }
      });
    }).on('error', (e) => {
      reject({
        endpoint,
        error: e.message
      });
    });
  });
}

/**
 * Check memory usage
 */
function checkMemoryUsage() {
  const memUsage = process.memoryUsage();
  return {
    rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
    external: `${Math.round(memUsage.external / 1024 / 1024)} MB`
  };
}

/**
 * Run diagnostics
 */
async function runDiagnostics() {
  log('=== Starting Server Diagnostics ===');
  
  // Check memory usage
  const memoryUsage = checkMemoryUsage();
  log('\nMemory Usage:');
  log(JSON.stringify(memoryUsage, null, 2));
  
  // Test endpoints
  log('\nTesting Endpoints:');
  for (const endpoint of ENDPOINTS) {
    try {
      const result = await makeRequest(endpoint);
      log(`\n[${result.statusCode}] ${endpoint} - ${result.responseTime}ms`);
      log(JSON.stringify(result.data, null, 2).substring(0, 500) + '...');
    } catch (error) {
      log(`\n[ERROR] ${endpoint}`);
      log(JSON.stringify(error, null, 2));
    }
  }
  
  log('\n=== Diagnostics Complete ===');
  log(`Results saved to: ${LOG_FILE}`);
}

// Run the diagnostics
runDiagnostics().catch(err => {
  console.error('Diagnostics failed:', err);
});
