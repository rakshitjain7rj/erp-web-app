// test_horizontal_form.js - Test script for horizontal form functionality

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testHorizontalFormAPI() {
  console.log('🧪 Testing Horizontal Form API Connectivity...\n');
  
  try {
    // Test 1: Check if server is running
    console.log('1. 🌐 Testing server connectivity...');
    const healthCheck = await axios.get(`${API_BASE_URL}/count-products`, {
      timeout: 5000
    });
    console.log('✅ Server is running and responsive');
    
    // Test 2: Test dyeing firms endpoint
    console.log('\n2. 🏭 Testing dyeing firms endpoint...');
    const firmsResponse = await axios.get(`${API_BASE_URL}/dyeing-firms`);
    console.log(`✅ Dyeing firms endpoint working, found ${firmsResponse.data.length || 0} firms`);
    
    // Test 3: Create a test count product (simulate form submission)
    console.log('\n3. 📝 Testing count product creation...');
    const testProduct = {
      partyName: "Test Party",
      dyeingFirm: "Test Dyeing Firm",
      yarnType: "Cotton Combed",
      count: "30s",
      shade: "Navy Blue",
      quantity: 150.00,
      completedDate: new Date().toISOString().split('T')[0],
      qualityGrade: "A",
      remarks: "Test horizontal form submission",
      lotNumber: `TEST-HOR-${Date.now()}`,
      processedBy: "System Test",
      customerName: "Test Customer",
      sentToDye: true,
      sentDate: new Date().toISOString().split('T')[0],
      received: false,
      receivedDate: "",
      receivedQuantity: 0,
      dispatch: false,
      dispatchDate: "",
      dispatchQuantity: 0,
      middleman: "Direct"
    };
    
    const createResponse = await axios.post(`${API_BASE_URL}/count-products`, testProduct);
    console.log('✅ Count product created successfully:', createResponse.data.id);
    
    // Test 4: Retrieve the created product
    console.log('\n4. 🔍 Testing product retrieval...');
    const retrieveResponse = await axios.get(`${API_BASE_URL}/count-products/${createResponse.data.id}`);
    console.log('✅ Product retrieved successfully:', retrieveResponse.data.customerName);
    
    // Test 5: Clean up test data
    console.log('\n5. 🗑️ Cleaning up test data...');
    await axios.delete(`${API_BASE_URL}/count-products/${createResponse.data.id}`);
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 All tests passed! Horizontal form should work correctly.');
    console.log('\n📋 Next steps:');
    console.log('   1. Open http://localhost:3000/count-product-overview');
    console.log('   2. Click "Add Dyeing Order" button');
    console.log('   3. Fill in the horizontal form');
    console.log('   4. Click "Submit Order"');
    console.log('   5. Check browser console for detailed logs');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 Troubleshooting:');
      console.log('   - Backend server not running on port 5000');
      console.log('   - Run: cd server && npm start');
      console.log('   - Check if any other service is using port 5000');
    } else if (error.response?.status === 404) {
      console.log('\n🔧 Troubleshooting:');
      console.log('   - API endpoints not found');
      console.log('   - Check server/routes configuration');
    } else if (error.response?.status === 500) {
      console.log('\n🔧 Troubleshooting:');
      console.log('   - Database connection issues');
      console.log('   - Run table creation scripts first');
      console.log('   - Check database configuration');
    }
  }
}

testHorizontalFormAPI();
