const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/authMiddleware');
const {
  submitDailyData,
  getDailyMachineData,
  getProductionEfficiency,
  getMainsReadings,
  getWeeklyData,
  getStats,
  updateDailyMachineData,
  deleteDailyMachineData
} = require('../controllers/asuController');

// Apply authentication middleware to write operations only (temporarily for debugging)
// TODO: Re-enable auth for all routes after debugging
// router.use(auth);

// Submit daily data (all forms combined) - requires auth
router.post('/daily', auth, submitDailyData);

// Get data with pagination and filters - temporarily no auth for debugging
router.get('/daily-machine', getDailyMachineData);
router.get('/production', getProductionEfficiency);
router.get('/mains', getMainsReadings);
router.get('/weekly', getWeeklyData);

// Get summary stats - temporarily no auth for debugging
router.get('/stats', getStats);

// Update and delete routes - requires auth
router.put('/daily-machine/:id', auth, updateDailyMachineData);
router.delete('/daily-machine/:id', auth, deleteDailyMachineData);

// Additional update/delete routes for other data types
router.put('/production/:id', async (req, res) => {
  try {
    const { ASUProductionEfficiency } = require('../models/ASUModels');
    const { id } = req.params;
    const [updated] = await ASUProductionEfficiency.update(req.body, {
      where: { id },
      returning: true
    });

    if (updated === 0) {
      return res.status(404).json({
        success: false,
        error: 'Production efficiency data not found'
      });
    }

    const updatedRecord = await ASUProductionEfficiency.findByPk(id);
    res.json({
      success: true,
      data: updatedRecord
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.put('/mains/:id', async (req, res) => {
  try {
    const { ASUMainsReading } = require('../models/ASUModels');
    const { id } = req.params;
    const [updated] = await ASUMainsReading.update(req.body, {
      where: { id },
      returning: true
    });

    if (updated === 0) {
      return res.status(404).json({
        success: false,
        error: 'Mains reading not found'
      });
    }

    const updatedRecord = await ASUMainsReading.findByPk(id);
    res.json({
      success: true,
      data: updatedRecord
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.put('/weekly/:id', async (req, res) => {
  try {
    const { ASUWeeklyData } = require('../models/ASUModels');
    const { id } = req.params;
    const [updated] = await ASUWeeklyData.update(req.body, {
      where: { id },
      returning: true
    });

    if (updated === 0) {
      return res.status(404).json({
        success: false,
        error: 'Weekly data not found'
      });
    }

    const updatedRecord = await ASUWeeklyData.findByPk(id);
    res.json({
      success: true,
      data: updatedRecord
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
