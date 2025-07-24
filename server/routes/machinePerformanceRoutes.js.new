// server/routes/machinePerformanceRoutes.js
const express = require('express');
const router = express.Router();
const { getMachinePerformance } = require('../controllers/machinePerformanceController');

// Get machine performance data
router.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: 'Machine Performance API endpoint is working!',
    timestamp: new Date().toISOString(),
  });
});

// Get machine performance data
router.get('/performance', (req, res) => {
  console.log('Machine performance route hit at: /api/machines/performance');
  getMachinePerformance(req, res);
});

// Get machine performance data using the legacy/alternate path
router.get('/status', (req, res) => {
  console.log('Machine status route hit at: /api/machines/status');
  getMachinePerformance(req, res);
});

module.exports = router;
