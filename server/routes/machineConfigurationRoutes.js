const express = require('express');
const router = express.Router();
const machineConfigController = require('../controllers/machineConfigurationController');

// Get all configurations for a machine
router.get('/machines/:machineId/configurations', machineConfigController.getMachineConfigurations);

// Create a new configuration for a machine
router.post('/machines/:machineId/configurations', machineConfigController.createMachineConfiguration);

// Update a specific configuration
router.put('/machine-configurations/:configId', machineConfigController.updateMachineConfiguration);

// Delete a specific configuration
router.delete('/machine-configurations/:configId', machineConfigController.deleteMachineConfiguration);

module.exports = router;
