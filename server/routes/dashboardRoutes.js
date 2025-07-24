// server/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');

// Get comprehensive dashboard stats
router.get('/stats', getDashboardStats);

module.exports = router;
