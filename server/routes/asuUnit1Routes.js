const express = require('express');
const router = express.Router();
const asuUnit1Controller = require('../controllers/asuUnit1Controller');
const { auth } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(auth);

// ASU Machine routes
router.get('/machines', asuUnit1Controller.getASUMachines);
router.post('/machines', asuUnit1Controller.createMachine);
router.put('/machines/:id', asuUnit1Controller.updateMachine);
router.delete('/machines/:id', asuUnit1Controller.deleteMachine);

// New dedicated API endpoints for machines
router.get('/asu-machines', asuUnit1Controller.getAllMachines);
router.post('/asu-machines', asuUnit1Controller.createMachine); // Added POST route for asu-machines
router.put('/asu-machines/:id', asuUnit1Controller.updateMachineYarnTypeAndCount);
router.delete('/asu-machines/:id', asuUnit1Controller.deleteMachine); // Added DELETE route for asu-machines
router.post('/machines/:id/archive', asuUnit1Controller.archiveMachine); // Archive instead of delete
router.post('/asu-machines/:id/archive', asuUnit1Controller.archiveMachine); // Archive instead of delete

// Production Entry routes
router.get('/production-entries', asuUnit1Controller.getProductionEntries);
router.post('/production-entries', asuUnit1Controller.createProductionEntry);
router.put('/production-entries/:id', asuUnit1Controller.updateProductionEntry);
router.delete('/production-entries/:id', asuUnit1Controller.deleteProductionEntry);

// Stats route
router.get('/stats', asuUnit1Controller.getProductionStats);

module.exports = router;
