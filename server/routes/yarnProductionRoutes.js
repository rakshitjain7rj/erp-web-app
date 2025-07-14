const express = require('express');
const router = express.Router();
const yarnProductionController = require('../controllers/yarnProductionController');
const { auth } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(auth);

// Yarn Production Entry routes
router.get('/production-entries', yarnProductionController.getYarnProductionEntries);

module.exports = router;
