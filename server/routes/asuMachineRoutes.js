const express = require('express');
const router = express.Router();
const { getAllMachines } = require('../controllers/asuMachineController');

// Get all active ASU machines
router.get('/', getAllMachines);

module.exports = router;
