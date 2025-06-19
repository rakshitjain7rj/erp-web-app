const express = require('express');
const router = express.Router({ mergeParams: true }); // Important for nested routes

// 📦 Controllers
const {
  createDyeingRecord,
  getAllDyeingRecords,
  getDyeingRecordById,
  updateArrivalDate
} = require('../controllers/dyeingController');

const {
  getDyeingSummary
} = require('../controllers/dyeingSummaryController');

const {
  getDueAlerts,
  getOverdueDyeing
} = require('../controllers/dyeingAlertController');

const {
  getFollowUpsByRecordId,
  createFollowUp
} = require('../controllers/dyeingFollowUpController');


// ✅ Summary route - should be defined before dynamic :id
router.get('/summary', getDyeingSummary);

// ✅ Alerts routes
router.get('/alerts/due', getDueAlerts);
router.get('/alerts/overdue', getOverdueDyeing);

// ✅ Main dyeing record routes
router.post('/', createDyeingRecord);
router.get('/', getAllDyeingRecords);
router.get('/:id', getDyeingRecordById);
router.put('/:id/arrival', updateArrivalDate);

// ✅ Follow-up routes (nested under dyeingRecordId)
router.get('/:dyeingRecordId/followups', getFollowUpsByRecordId);
router.post('/:dyeingRecordId/followups', createFollowUp);

module.exports = router;
