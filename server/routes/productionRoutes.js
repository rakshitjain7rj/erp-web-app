const express = require('express');
const { auth: protect } = require('../middleware/authMiddleware');
const {
  createProductionJob,
  createDetailedProductionJob,
  getAllProductionJobs,
  getProductionJobById,
  updateProductionJob,
  updateJobStatus,
  startProductionJob,
  completeProductionJob,
  deleteProductionJob,
  addHourlyEfficiency,
  addUtilityReading,
  getProductionStats,
  getMachines,
  getMachineById,
  createMachine,
  updateMachine,
  deleteMachine,
  getMachinesByType,
  getActiveMachines
} = require('../controllers/productionController');

const router = express.Router();

// Test endpoint without auth for debugging
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Production API is working',
    data: {
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0
    }
  });
});

// Temporary: Main production jobs endpoint without auth for testing
router.get('/', getAllProductionJobs);
router.post('/', createProductionJob);

// Statistics Route (temporary without auth)
router.get('/stats', getProductionStats);

// Machine Routes (temporary without auth)
router.route('/machines')
  .get(getMachines)
  .post(createMachine);

// Apply authentication middleware to all other routes
router.use(protect);

// Production Job Routes
router.route('/')
  .get(getAllProductionJobs)
  .post(createProductionJob);

router.post('/detailed', createDetailedProductionJob);

router.route('/:id')
  .get(getProductionJobById)
  .put(updateProductionJob)
  .delete(deleteProductionJob);

// Job Status and Action Routes
router.patch('/:id/status', updateJobStatus);
router.post('/:id/start', startProductionJob);
router.post('/:id/complete', completeProductionJob);

// Job Card Data Routes
router.post('/:id/efficiency', addHourlyEfficiency);
router.post('/:id/utility-reading', addUtilityReading);

// Machine Routes
router.route('/machines')
  .get(getMachines)
  .post(createMachine);

router.route('/machines/:id')
  .get(getMachineById)
  .put(updateMachine)
  .delete(deleteMachine);

router.get('/machines/type/:type', getMachinesByType);
router.get('/machines/active', getActiveMachines);

module.exports = router;
