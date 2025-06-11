const express = require('express');
const router = express.Router();
const { getProductionReport, getDelayedOrders } = require('../controllers/reportController');
const { auth, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/summary', auth, authorizeRoles('manager', 'admin'), getProductionReport);
router.get('/delays', auth, authorizeRoles('manager', 'admin'), getDelayedOrders);

module.exports = router;
