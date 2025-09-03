const express = require('express');
const router = express.Router();
const machineConfigController = require('../controllers/machineConfigurationController');

// NOTE: These routes are intended to be mounted at /api, resulting in:
// GET /api/machines/:machineId/configurations
// If mounted instead at /api/machine-configurations adjust mount point instead of editing here.

// List all configurations for a specific machine
router.get('/machines/:machineId/configurations', machineConfigController.getMachineConfigurations);

// Create a new configuration for a specific machine
router.post('/machines/:machineId/configurations', machineConfigController.createMachineConfiguration);

// Update a specific configuration by id
router.put('/machine-configurations/:configId', machineConfigController.updateMachineConfiguration);

// Delete a specific configuration by id
router.delete('/machine-configurations/:configId', machineConfigController.deleteMachineConfiguration);

module.exports = router;
