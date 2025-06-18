const express = require('express');
const router = express.Router({ mergeParams: true }); // Important for nested params
const {
  getFollowUpsByRecordId,
  createFollowUp
} = require('../controllers/dyeingFollowUpController');

// GET all follow-ups for a dyeing record
router.get('/', getFollowUpsByRecordId);

// POST a new follow-up to a dyeing record
router.post('/', createFollowUp);

module.exports = router;
