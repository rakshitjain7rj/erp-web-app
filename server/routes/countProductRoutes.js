// server/routes/countProductRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const { auth } = require('../middleware/authMiddleware');

// Controllers
const {
  getFollowUpsByCountProductId,
  createCountProductFollowUp,
  deleteCountProductFollowUp,
} = require('../controllers/countProductFollowUpController');

// ===== 💬 Follow-Up Routes =====
router.get('/:countProductId/followups', getFollowUpsByCountProductId);
router.post('/:countProductId/followups', auth, createCountProductFollowUp);
router.delete('/:countProductId/followups/:followUpId', auth, deleteCountProductFollowUp);

module.exports = router;
