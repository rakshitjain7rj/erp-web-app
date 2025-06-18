const express = require('express');
const router = express.Router();
const { getDyeingSummary } = require('../controllers/dyeingSummaryController');

router.get('/', getDyeingSummary);

module.exports = router;
