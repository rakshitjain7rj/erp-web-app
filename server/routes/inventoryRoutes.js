// server/routes/inventoryRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/inventoryController');

// Main CRUD routes
router.post('/', controller.create);           // POST /api/inventory
router.get('/', controller.getAll);           // GET /api/inventory
router.get('/:id', controller.getById);       // GET /api/inventory/:id
router.put('/:id', controller.update);        // PUT /api/inventory/:id
router.delete('/:id', controller.delete);     // DELETE /api/inventory/:id

// Advanced metrics endpoints
router.get('/metrics/balance', controller.getCurrentYarnBalance);      // GET /api/inventory/metrics/balance
router.get('/metrics/consumption', controller.getProductConsumption);  // GET /api/inventory/metrics/consumption
router.get('/metrics/pricing', controller.getYarnPricing);             // GET /api/inventory/metrics/pricing
router.get('/audit/logs', controller.getAuditLogs);                    // GET /api/inventory/audit/logs

module.exports = router;
