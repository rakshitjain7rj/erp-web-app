/**
 * Test and Verify Fixes
 * 
 * This script tests the API endpoints that were fixed to ensure they're working correctly.
 */

const axios = require('axios');
const { sequelize } = require('../server/config/postgres');
const ASUMachine = require('../server/models/ASUMachine');
const ASUProductionEntry = require('../server/models/ASUProductionEntry');

// Configuration
const API_BASE_URL = 'http://localhost:3000/api'; // Adjust based on your server configuration
let authToken = '';

// Helper to format responses for console output
const formatResponse = (data) => {
  if (typeof data === 'object') {
    return JSON.stringify(data, null, 2);
  }
  return data;
};

// Test functions
async function testLogin() {
  try {
    console.log('🔑 Testing login...');
    const response = await axios.post(`${API_BASE_URL}/users/login`, {
      username: 'admin', // Update with valid credentials
      password: 'password123' // Update with valid credentials
    });
    
    authToken = response.data.token;
    console.log('✅ Login successful, token received');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function testDashboardEndpoint() {
  try {
    console.log('\n📊 Testing dashboard endpoint...');
    const response = await axios.get(`${API_BASE_URL}/dashboard`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ Dashboard endpoint response:');
    console.log(`Status: ${response.status}`);
    console.log(`Data preview: ${formatResponse(response.data).substring(0, 300)}...`);
    return true;
  } catch (error) {
    console.error('❌ Dashboard endpoint failed:', error.response?.data || error.message);
    if (error.response?.data?.error?.includes('machine_id')) {
      console.error('❗ Error still contains "machine_id" reference!');
    }
    return false;
  }
}

async function testMachinePerformanceEndpoint() {
  try {
    console.log('\n⚙️ Testing machine performance endpoint...');
    const response = await axios.get(`${API_BASE_URL}/machine-performance`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ Machine performance endpoint response:');
    console.log(`Status: ${response.status}`);
    console.log(`Data preview: ${formatResponse(response.data).substring(0, 300)}...`);
    return true;
  } catch (error) {
    console.error('❌ Machine performance endpoint failed:', error.response?.data || error.message);
    if (error.response?.data?.error?.includes('machine_id')) {
      console.error('❗ Error still contains "machine_id" reference!');
    }
    return false;
  }
}

async function testProductionEntryCreation() {
  try {
    console.log('\n📝 Testing production entry creation...');
    
    // First, get an existing machine
    const machines = await ASUMachine.findAll({ limit: 1 });
    
    if (machines.length === 0) {
      console.log('⚠️ No machines found, creating a test machine');
      const newMachine = await ASUMachine.create({
        machineNo: 999,
        count: 40,
        spindles: 1440,
        speed: 12000,
        productionAt100: 86.4,
        unit: 1,
        isActive: true
      });
      console.log(`✅ Test machine created with ID ${newMachine.id} and machine_no ${newMachine.machineNo}`);
      var machineNo = newMachine.machineNo;
    } else {
      var machineNo = machines[0].machineNo;
      console.log(`✅ Using existing machine with machine_no ${machineNo}`);
    }
    
    // Create a production entry
    const today = new Date().toISOString().split('T')[0];
    const productionEntry = await ASUProductionEntry.create({
      unit: 1,
      machineNumber: machineNo,
      date: today,
      shift: 'day',
      actualProduction: 85.5,
      theoreticalProduction: 100.0,
      efficiency: 85.5,
      remarks: 'Test entry created by verification script'
    });
    
    console.log(`✅ Production entry created successfully with ID ${productionEntry.id}`);
    return true;
  } catch (error) {
    console.error('❌ Production entry creation failed:', error.message);
    return false;
  }
}

async function verifyDatabaseRelations() {
  try {
    console.log('\n🔍 Verifying database relations...');
    
    // Query to check if machine_no is properly related in both tables
    const [results] = await sequelize.query(`
      SELECT 
        m.id AS machine_id, 
        m.machine_no AS machine_machine_no, 
        pe.id AS production_id, 
        pe.machine_number AS production_machine_no
      FROM asu_machines m
      JOIN asu_production_entries pe ON m.machine_no = pe.machine_number
      LIMIT 5;
    `);
    
    console.log('✅ Database relation query results:');
    console.table(results);
    
    return results.length > 0;
  } catch (error) {
    console.error('❌ Database relation verification failed:', error.message);
    return false;
  }
}

async function verifyColumnNames() {
  try {
    console.log('\n🔍 Verifying column names in database tables...');
    
    // Check asu_machines columns
    const [machineColumns] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'asu_machines'
      ORDER BY ordinal_position;
    `);
    
    console.log('asu_machines columns:');
    console.table(machineColumns);
    
    // Check asu_production_entries columns
    const [productionColumns] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'asu_production_entries'
      ORDER BY ordinal_position;
    `);
    
    console.log('asu_production_entries columns:');
    console.table(productionColumns);
    
    // Verify machine_id does not exist and machine_no does exist
    const machineIdInProduction = productionColumns.some(col => col.column_name === 'machine_id');
    const machineNoInProduction = productionColumns.some(col => 
      col.column_name === 'machine_no' || col.column_name === 'machine_number'
    );
    
    console.log(`machine_id column in production table: ${machineIdInProduction ? 'YES ⚠️' : 'NO ✅'}`);
    console.log(`machine_no or machine_number column in production table: ${machineNoInProduction ? 'YES ✅' : 'NO ⚠️'}`);
    
    return !machineIdInProduction && machineNoInProduction;
  } catch (error) {
    console.error('❌ Column name verification failed:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🧪 Running verification tests for fixed issues...');
  console.log('=================================================');
  
  // Verify database schema
  let dbTestsSuccessful = true;
  try {
    dbTestsSuccessful = await verifyColumnNames() && await verifyDatabaseRelations();
  } catch (error) {
    console.error('Database tests failed:', error);
    dbTestsSuccessful = false;
  }
  
  // Test the production entry creation
  let productionEntryTestSuccessful = true;
  try {
    productionEntryTestSuccessful = await testProductionEntryCreation();
  } catch (error) {
    console.error('Production entry test failed:', error);
    productionEntryTestSuccessful = false;
  }
  
  // API endpoint tests (requires server to be running)
  console.log('\n⚠️ API tests require the server to be running.');
  console.log('If the server is running, press Enter to continue with API tests...');
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('', async () => {
    readline.close();
    
    let apiLoggedIn = false;
    try {
      apiLoggedIn = await testLogin();
    } catch (error) {
      console.error('Login test failed:', error);
    }
    
    if (apiLoggedIn) {
      let dashboardTestSuccessful = false;
      let performanceTestSuccessful = false;
      
      try {
        dashboardTestSuccessful = await testDashboardEndpoint();
      } catch (error) {
        console.error('Dashboard test failed:', error);
      }
      
      try {
        performanceTestSuccessful = await testMachinePerformanceEndpoint();
      } catch (error) {
        console.error('Machine performance test failed:', error);
      }
      
      // Summary of API tests
      console.log('\n📋 API Tests Summary:');
      console.log(`Dashboard API: ${dashboardTestSuccessful ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`Machine Performance API: ${performanceTestSuccessful ? '✅ PASS' : '❌ FAIL'}`);
    }
    
    // Summary of all tests
    console.log('\n📋 Overall Test Results:');
    console.log(`Database Structure: ${dbTestsSuccessful ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Production Entry Creation: ${productionEntryTestSuccessful ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`API Access: ${apiLoggedIn ? '✅ PASS' : '❌ FAIL'}`);
    
    // Close the database connection
    await sequelize.close();
    
    console.log('\n🏁 Test and verification complete!');
  });
}

// Run the tests
runAllTests();
