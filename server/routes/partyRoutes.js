const express = require('express');
const router = express.Router({ mergeParams: true });
const { auth } = require('../middleware/authMiddleware');

// Controllers
const {
  getAllPartiesSummary,
  getPartyDetails,
  getAllPartyNames,
  getPartyStatistics,
} = require('../controllers/partyController');

// ===== 🏢 Party Summary Routes =====
// Main party dashboard data - supports query params like ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/summary', getAllPartiesSummary);

// Party statistics for dashboard cards
router.get('/statistics', getPartyStatistics);

// Get all unique party names
router.get('/names', getAllPartyNames);

// ===== 🏢 Individual Party Routes =====
// Get detailed information about a specific party
router.get('/:partyName/details', getPartyDetails);

module.exports = router;
