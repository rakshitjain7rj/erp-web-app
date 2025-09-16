const express = require('express');
const router = express.Router();
const asuUnit2Controller = require('../controllers/asuUnit2Controller');
const { auth } = require('../middleware/authMiddleware');
const { readOnlyForManagers } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(auth);

// ASU Unit 2 Machine routes
router.get('/machines', asuUnit2Controller.getASUMachines);
router.post('/machines', readOnlyForManagers, asuUnit2Controller.createMachine);
router.put('/machines/:id', readOnlyForManagers, asuUnit2Controller.updateMachine);
router.delete('/machines/:id', readOnlyForManagers, asuUnit2Controller.deleteMachine);

// Dedicated API endpoints for machines
router.get('/asu-machines', asuUnit2Controller.getAllMachines);
router.post('/asu-machines', readOnlyForManagers, asuUnit2Controller.createMachine);
router.put('/asu-machines/:id', readOnlyForManagers, asuUnit2Controller.updateMachineYarnTypeAndCount);
router.delete('/asu-machines/:id', readOnlyForManagers, asuUnit2Controller.deleteMachine);
router.post('/machines/:id/archive', readOnlyForManagers, asuUnit2Controller.archiveMachine);
router.post('/asu-machines/:id/archive', readOnlyForManagers, asuUnit2Controller.archiveMachine);

// Production Entries
router.get('/production-entries', asuUnit2Controller.getProductionEntries);
router.post('/production-entries', readOnlyForManagers, asuUnit2Controller.createProductionEntry);
router.put('/production-entries/:id', readOnlyForManagers, asuUnit2Controller.updateProductionEntry);
router.delete('/production-entries/:id', readOnlyForManagers, asuUnit2Controller.deleteProductionEntry);

// Stats
router.get('/stats', asuUnit2Controller.getProductionStats);

module.exports = router;
