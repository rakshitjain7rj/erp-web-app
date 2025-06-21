const express = require('express');
const router = express.Router({ mergeParams: true });

// Controllers
const {
  createDyeingRecord,
  getAllDyeingRecords,
  getDyeingRecordById,
  updateArrivalDate,
  updateExpectedArrivalDate,
  updateDyeingRecord, // ✅ Add this line
  deleteDyeingRecord,
  getDyeingSummary,
} = require('../controllers/dyeingController');

const {
  getDueAlerts,
  getOverdueDyeing,
  getArrivedDyeing,
} = require('../controllers/dyeingAlertController');

const {
  getFollowUpsByRecordId,
  createFollowUp,
} = require('../controllers/dyeingFollowUpController');

// ===== 📦 Summary Route =====
router.get('/summary', getDyeingSummary); // ✅ Must stay before "/:id"

// ===== 🚨 Alert Routes =====
router.get('/alerts/due', getDueAlerts);
router.get('/alerts/overdue', getOverdueDyeing);
router.get('/alerts/arrived', getArrivedDyeing);

// ===== 📋 Main Dyeing Record Routes =====
router.post('/', createDyeingRecord);
router.get('/', getAllDyeingRecords);
router.get('/:id', getDyeingRecordById);
router.put('/:id', updateDyeingRecord); // ✅ Add this route
router.delete('/:id', deleteDyeingRecord);

// ===== 📅 Update Routes =====
router.put('/:id/arrival', updateArrivalDate);
router.put('/:id/expected-arrival', updateExpectedArrivalDate);

// ===== 💬 Follow-Up Routes =====
router.get('/:dyeingRecordId/followups', getFollowUpsByRecordId);
router.post('/:dyeingRecordId/followups', createFollowUp);

module.exports = router;
