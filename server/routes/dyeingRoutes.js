const express = require('express');
const router = express.Router();

const {
  createDyeingRecord,
  getAllDyeingRecords,
  getDyeingRecordById,
  updateArrivalDate
} = require('../controllers/dyeingController');

const { getDueAlerts } = require('../controllers/dyeingAlertController');

// ✳️ Import nested follow-up routes
const followUpRoutes = require('./dyeingFollowUpRoutes');

// ✅ Main dyeing record routes
router.post('/', createDyeingRecord);
router.get('/', getAllDyeingRecords);
router.get('/alerts', getDueAlerts);
router.get('/:id', getDyeingRecordById);


// ✅ Nested follow-up routes mounted AFTER /:id so there's no conflict
router.use('/:dyeingRecordId/followups', followUpRoutes);

router.put('/:id/arrival', updateArrivalDate);


module.exports = router;
