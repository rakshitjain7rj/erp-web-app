// Script to sync machine configuration history from localStorage to the database
// This script will read all machine configuration history from localStorage and save it to the database

import axios from 'axios';

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';
const API_BASE_URL = `${BASE_URL}/asu-unit1`;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Ensure the machine_configurations table exists
async function ensureTableExists() {
  try {
    console.log('Checking if machine_configurations table exists...');
    await api.post('/ensure-machine-configurations-table');
    console.log('Machine configurations table check complete');
  } catch (error) {
    console.error('Error ensuring table exists:', error);
    throw error;
  }
}

// Get all machines
async function getAllMachines() {
  try {
    console.log('Fetching all machines...');
    const response = await api.get('/machines');
    const machines = response.data.success ? response.data.data : response.data;
    console.log(`Found ${machines.length} machines`);
    return machines;
  } catch (error) {
    console.error('Error fetching machines:', error);
    throw error;
  }
}

// Get configuration history from localStorage
function getConfigurationFromLocalStorage(machineId: number) {
  const historyKey = `machine_config_history_${machineId}`;
  try {
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    console.log(`Found ${history.length} configuration entries for machine ${machineId} in localStorage`);
    return history;
  } catch (error) {
    console.error(`Error retrieving configuration history for machine ${machineId}:`, error);
    return [] as any[];
  }
}

// Save configuration to database
async function saveConfigurationToDatabase(machineId: number, configuration: any) {
  try {
    console.log(`Saving configuration for machine ${machineId} to database:`, configuration);
    const response = await api.post('/machine-configurations', {
      machineId: machineId,
      configuration: configuration
    });
    console.log(`Configuration saved to database:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error saving configuration for machine ${machineId}:`, error);
    throw error;
  }
}

// Main function
async function syncMachineConfigurations() {
  try {
    // Ensure the table exists
    await ensureTableExists();

    // Get all machines
    const machines = await getAllMachines();
    let totalEntriesSynced = 0;

    // For each machine, get configuration history and save to database
    for (const machine of machines) {
      console.log(`Processing machine ${machine.id} (${machine.machineName || machine.machineNo})...`);
      const configurations = getConfigurationFromLocalStorage(machine.id);
      
      if (configurations.length > 0) {
        console.log(`Found ${configurations.length} configurations for machine ${machine.id} in localStorage`);
        
        // Save each configuration to database
        for (const config of configurations) {
          await saveConfigurationToDatabase(machine.id, config);
          totalEntriesSynced++;
        }
      } else {
        console.log(`No configurations found for machine ${machine.id} in localStorage`);
      }
    }

    console.log(`Sync complete. ${totalEntriesSynced} entries synced to database.`);
  } catch (error) {
    console.error('Error syncing machine configurations:', error);
  }
}

// Note: Legacy browser-dependent script; provided for reference.
