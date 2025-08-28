// Simple test without node-fetch
const http = require('http');

function makeRequest(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(responseData);
                    resolve(parsedData);
                } catch (e) {
                    resolve(responseData);
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

async function testAPI() {
    try {
        console.log('🔍 Testing Count Products API...');
        
        const response = await makeRequest('http://localhost:5000/api/count-products');
        console.log('API Response:', JSON.stringify(response, null, 2));
        
        if (response.data && response.data.length > 0) {
            console.log('\nFirst product fields:', Object.keys(response.data[0]));
            console.log('First product:', response.data[0]);
            
            // Test if sentQuantity field exists
            if ('sentQuantity' in response.data[0]) {
                console.log('✅ sentQuantity field exists in database');
            } else {
                console.log('❌ sentQuantity field missing from database');
            }
        }
        
        console.log('Test completed successfully');
        process.exit(0);
        
    } catch (error) {
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

testAPI();
