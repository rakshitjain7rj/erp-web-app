// Test script to verify sentQuantity persistence
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';

async function testPersistence() {
    try {
        console.log('🔍 Testing Count Products API...');
        
        // 1. Fetch existing data
        console.log('\n1. Fetching current data...');
        const response = await fetch(`${API_BASE}/count-products`);
        const products = await response.json();
        
        console.log('Current products:', products.length);
        if (products.length > 0) {
            console.log('First product fields:', Object.keys(products[0]));
            console.log('First product data:', products[0]);
        }
        
        // 2. Test update with different sentQuantity
        if (products.length > 0) {
            const productId = products[0].id;
            const updateData = {
                quantity: 100,
                sentQuantity: 75,
                sentToDye: true
            };
            
            console.log('\n2. Updating product with different sentQuantity...');
            console.log('Update data:', updateData);
            
            const updateResponse = await fetch(`${API_BASE}/count-products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });
            
            if (updateResponse.ok) {
                const updatedProduct = await updateResponse.json();
                console.log('Updated product:', updatedProduct);
                
                // 3. Fetch again to verify persistence
                console.log('\n3. Fetching again to verify persistence...');
                const verifyResponse = await fetch(`${API_BASE}/count-products/${productId}`);
                const verifiedProduct = await verifyResponse.json();
                console.log('Verified product:', verifiedProduct);
                
                // Check if values are different
                if (verifiedProduct.quantity !== verifiedProduct.sentQuantity) {
                    console.log('✅ SUCCESS: Different values persisted correctly');
                    console.log(`   quantity: ${verifiedProduct.quantity}`);
                    console.log(`   sentQuantity: ${verifiedProduct.sentQuantity}`);
                } else {
                    console.log('❌ ISSUE: Values are the same after persistence');
                    console.log(`   quantity: ${verifiedProduct.quantity}`);
                    console.log(`   sentQuantity: ${verifiedProduct.sentQuantity}`);
                }
            } else {
                console.error('Update failed:', updateResponse.status, updateResponse.statusText);
            }
        } else {
            console.log('No products found to test');
        }
        
    } catch (error) {
        console.error('Error testing persistence:', error.message);
    }
}

testPersistence();
