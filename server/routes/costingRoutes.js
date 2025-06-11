const express = require('express');
const router = express.Router();
const { calculateCost, getCostByWorkOrder } = require('../controllers/costingController');
const { auth, authorizeRoles } = require('../middleware/authMiddleware');

// Manager/Admin can calculate cost
router.post('/', auth, authorizeRoles('manager', 'admin'), calculateCost);

// Any authenticated user can view
router.get('/:id', auth, getCostByWorkOrder);

module.exports = router;
