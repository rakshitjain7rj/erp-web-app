// server/routes/yarnProductionRoutes.js
const express = require('express');
const router = express.Router();
const yarnProductionController = require('../controllers/yarnProductionController');
const { auth } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(auth);

// Get grouped yarn production entries
router.get('/production-entries', yarnProductionController.getYarnProductionEntries);

// OPTIONAL: Add new yarn production entry (if enabled later)
// router.post('/production-entries', yarnProductionController.createProductionEntry);

// OPTIONAL: Future yarn consumption breakdown (if implemented)
// router.get('/yarn-consumption', yarnProductionController.getYarnConsumption);

module.exports = router;
