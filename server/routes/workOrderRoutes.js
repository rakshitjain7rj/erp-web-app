const express = require('express');
const router = express.Router();
const controller = require('../controllers/workOrderController');

// ✅ Middleware for auth and role control
const { auth, authorizeRoles } = require('../middleware/authMiddleware');

// 🛠 ROUTES

// Create Work Order - only admin or manager can create
router.post('/', auth, authorizeRoles('admin', 'manager'), controller.create);

// Get All Work Orders - any logged-in user can view
router.get('/', auth, controller.getAll);

// Update Status - only manager can mark production progress
router.put('/:id/status', auth, authorizeRoles('manager'), controller.updateStatus);

module.exports = router;
