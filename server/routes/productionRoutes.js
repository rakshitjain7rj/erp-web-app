const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/authMiddleware');

// Controllers
const {
  createProductionJob,
  getAllProductionJobs,
  getProductionJobById,
  updateProductionJob,
  updateJobStatus,
  deleteProductionJob,
  getProductionSummary,
  getJobsByParty,
  createJobFromDyeingOrder,
  getMachines,
  createMachine
} = require('../controllers/productionController');

// ===== 📊 Dashboard Routes =====
router.get('/dashboard', getProductionSummary);

// ===== 🏭 Machine Routes =====
router.get('/machines', getMachines);
router.post('/machines', auth, createMachine);

// ===== 📋 Main Production Job Routes =====
router.post('/', auth, createProductionJob);
router.get('/', getAllProductionJobs);
router.get('/:id', getProductionJobById);
router.put('/:id', auth, updateProductionJob);
router.delete('/:id', auth, deleteProductionJob);

// ===== 📅 Status Update Routes =====
router.patch('/:id/status', auth, updateJobStatus);

// ===== 🔗 Integration Routes =====
router.get('/party/:partyName', getJobsByParty);
router.post('/from-dyeing/:dyeingOrderId', auth, createJobFromDyeingOrder);

module.exports = router;
