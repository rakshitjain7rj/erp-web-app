const express = require('express');
const router = express.Router();
const asuUnit1Controller = require('../controllers/asuUnit1Controller');
const { auth } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(auth);

// ASU Machine routes
router.get('/machines', asuUnit1Controller.getASUMachines);

// Production Entry routes
router.get('/production-entries', asuUnit1Controller.getProductionEntries);
router.post('/production-entries', asuUnit1Controller.createProductionEntry);
router.put('/production-entries/:id', asuUnit1Controller.updateProductionEntry);
router.delete('/production-entries/:id', asuUnit1Controller.deleteProductionEntry);

// Stats route
router.get('/stats', asuUnit1Controller.getProductionStats);

module.exports = router;
