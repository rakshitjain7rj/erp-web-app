// server/routes/inventoryRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/inventoryController');
const { auth } = require('../middleware/authMiddleware');

// Main CRUD routes
// All inventory routes require auth (read allowed for all authenticated roles)
router.get('/', auth, controller.getAll);           // GET /api/inventory
router.get('/:id', auth, controller.getById);       // GET /api/inventory/:id

// Mutations require non-manager (enforced also globally by readOnlyForManagers)
router.post('/', auth, controller.create);           // POST /api/inventory
router.put('/:id', auth, controller.update);        // PUT /api/inventory/:id
router.delete('/:id', auth, controller.delete);     // DELETE /api/inventory/:id

// Advanced metrics endpoints
router.get('/metrics/balance', auth, controller.getCurrentYarnBalance);      // GET /api/inventory/metrics/balance
router.get('/metrics/consumption', auth, controller.getProductConsumption);  // GET /api/inventory/metrics/consumption
router.get('/metrics/pricing', auth, controller.getYarnPricing);             // GET /api/inventory/metrics/pricing
router.get('/audit/logs', auth, controller.getAuditLogs);                    // GET /api/inventory/audit/logs

module.exports = router;
