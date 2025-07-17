const express = require('express');
const router = express.Router({ mergeParams: true });
// const { auth } = require('../middleware/authMiddleware'); // Optional auth for now

// Controllers
const {
  getAllPartiesSummary,
  getPartyDetails,
  getAllPartyNames,
  getPartyStatistics,
  createParty,
} = require('../controllers/partyController');

// Debug logging
console.log('🔧 Party routes loading...');
console.log('🔧 createParty function:', typeof createParty);

// ===== 🏢 Party Summary Routes =====
// Main party dashboard data - supports query params like ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/summary', getAllPartiesSummary);

// Party statistics for dashboard cards
router.get('/statistics', getPartyStatistics);

// Get all unique party names
router.get('/names', getAllPartyNames);

// Create a new party (no auth required for testing)
router.post('/', (req, res, next) => {
  console.log('🚀 POST /api/parties route hit');
  console.log('📝 Request body:', req.body);
  console.log('📝 Content-Type:', req.get('Content-Type'));
  next();
}, createParty);

// ===== 🏢 Individual Party Routes =====
// Get detailed information about a specific party
router.get('/:partyName/details', getPartyDetails);

console.log('✅ Party routes registered successfully');

module.exports = router;
