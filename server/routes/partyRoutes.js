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
  updateParty,
  deleteParty,
  archiveParty,
  exportPartyAsJSON,
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

// Update a specific party
router.put('/:partyName', updateParty);

// Delete a specific party
router.delete('/:partyName', deleteParty);

// Archive a specific party
router.post('/:partyName/archive', archiveParty);

// Export party data as JSON
router.get('/:partyName/export', exportPartyAsJSON);

console.log('✅ Party routes registered successfully');

module.exports = router;
