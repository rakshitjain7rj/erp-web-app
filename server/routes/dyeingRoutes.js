const express = require('express');
const router = express.Router({ mergeParams: true });

// 📦 Controllers - UPDATE this import to include deleteDyeingRecord
const {
  createDyeingRecord,
  getAllDyeingRecords,
  getDyeingRecordById,
  updateArrivalDate,
  updateExpectedArrivalDate,
  deleteDyeingRecord // Add this import
} = require('../controllers/dyeingController');

const {
  getDyeingSummary
} = require('../controllers/dyeingSummaryController');

const {
  getDueAlerts,
  getOverdueDyeing,
  getArrivedDyeing
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
router.get('/alerts/arrived', getArrivedDyeing);

// ✅ Main dyeing record routes
router.post('/', createDyeingRecord);
router.get('/', getAllDyeingRecords);
router.get('/:id', getDyeingRecordById);
router.delete('/:id', deleteDyeingRecord); // ADD THIS LINE

// ✅ Update routes
router.put('/:id/arrival', updateArrivalDate); // Mark as arrived
router.put('/:id/expected-arrival', updateExpectedArrivalDate); // Update expected date

// ✅ Follow-up routes (nested under dyeingRecordId)
router.get('/:dyeingRecordId/followups', getFollowUpsByRecordId);
router.post('/:dyeingRecordId/followups', createFollowUp);

module.exports = router;