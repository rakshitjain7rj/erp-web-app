/**
 * Test script for ASU Unit 1 API endpoints
 * This script simulates the frontend API calls to verify backend behavior
 */

const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

// Configuration
const API_URL = 'http://localhost:5000/api';
const ASU_UNIT1_API = `${API_URL}/asu-unit1`;

// Sample data
const sampleMachineData = {
  machineNo: 1,
  count: 30,
  spindles: 1200,
  speed: 18000,
  productionAt100: 450,
  unit: 1,
  isActive: true
};

const sampleProductionData = {
  machineNumber: 1,
  date: new Date().toISOString().split('T')[0],
  shift: 'day',
  actualProduction: 350,
  theoreticalProduction: 450,
  remarks: 'Test entry'
};

// Test functions
async function testGetMachines() {
  console.log('\n--- Testing GET /machines ---');
  try {
    const response = await axios.get(`${ASU_UNIT1_API}/machines`);
    console.log('Success:', response.status);
    console.log(`Received ${response.data.data.length} machines`);
    return response.data.data;
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
    return [];
  }
}

async function testCreateProductionEntry(machineNumber) {
  console.log('\n--- Testing POST /production-entries ---');
  const data = { ...sampleProductionData, machineNumber };
  
  try {
    const response = await axios.post(`${ASU_UNIT1_API}/production-entries`, data);
    console.log('Success:', response.status);
    console.log('Created entry:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
    return null;
  }
}

async function testGetProductionEntries(machineNumber) {
  console.log('\n--- Testing GET /production-entries ---');
  try {
    const response = await axios.get(`${ASU_UNIT1_API}/production-entries?machineNumber=${machineNumber}`);
    console.log('Success:', response.status);
    console.log(`Received ${response.data.data.items.length} entries`);
    return response.data.data.items;
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
    return [];
  }
}

async function testUpdateProductionEntry(id, data) {
  console.log(`\n--- Testing PUT /production-entries/${id} ---`);
  try {
    const response = await axios.put(`${ASU_UNIT1_API}/production-entries/${id}`, data);
    console.log('Success:', response.status);
    console.log('Updated entry:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
    return null;
  }
}

async function testGetStats() {
  console.log('\n--- Testing GET /stats ---');
  try {
    const response = await axios.get(`${ASU_UNIT1_API}/stats`);
    console.log('Success:', response.status);
    console.log('Stats:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
    return null;
  }
}

// Main test flow
async function runTests() {
  try {
    console.log('=== Starting ASU Unit 1 API Tests ===');
    
    // Test getting machines
    const machines = await testGetMachines();
    if (machines.length === 0) {
      console.log('No machines found - please create a machine first');
      return;
    }
    
    // Use first machine for testing
    const testMachine = machines[0];
    console.log(`Using machine #${testMachine.machineNo} for tests`);
    
    // Test creating a day shift entry
    sampleProductionData.shift = 'day';
    sampleProductionData.actualProduction = 350;
    const dayEntry = await testCreateProductionEntry(testMachine.machineNo);
    
    // Test creating a night shift entry
    sampleProductionData.shift = 'night';
    sampleProductionData.actualProduction = 380;
    const nightEntry = await testCreateProductionEntry(testMachine.machineNo);
    
    // Get production entries for the machine
    await testGetProductionEntries(testMachine.machineNo);
    
    // Update day entry if created
    if (dayEntry) {
      await testUpdateProductionEntry(dayEntry.id, { 
        actualProduction: 370,
        remarks: 'Updated test entry'
      });
    }
    
    // Get stats
    await testGetStats();
    
    console.log('\n=== API Tests Completed ===');
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run the tests
runTests();
