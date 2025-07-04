const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/authMiddleware');
const controller = require('../controllers/asuController');

// POST - submit all data
router.post('/daily', (req, res) => controller.submitDailyData(req, res, 2));

// GET - summary + sections
router.get('/daily-machine', (req, res) => controller.getDailyMachineData(req, res, 2));
router.get('/production', (req, res) => controller.getProductionEfficiency(req, res, 2));
router.get('/mains', (req, res) => controller.getMainsReadings(req, res, 2));
router.get('/weekly', (req, res) => controller.getWeeklyData(req, res, 2));
router.get('/stats', (req, res) => controller.getStats(req, res, 2));

// PUT / DELETE - updates for Daily Machine
router.put('/daily-machine/:id', auth, (req, res) => controller.updateDailyMachineData(req, res, 2));
router.delete('/daily-machine/:id', auth, (req, res) => controller.deleteDailyMachineData(req, res, 2));

// You can copy production/mains/weekly PUTs here too if needed
module.exports = router;
