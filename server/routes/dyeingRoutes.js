const express = require('express');
const router = express.Router({ mergeParams: true });
const { auth } = require('../middleware/authMiddleware');

// Controllers
const {
  createDyeingRecord,
  getAllDyeingRecords,
  getDyeingRecordById,
  updateDyeingRecord,
  deleteDyeingRecord,
} = require('../controllers/dyeingController');

// ===== 📋 Basic CRUD Routes =====
// Read routes (auth required so manager role is known; manager still allowed to view)
router.get('/', auth, getAllDyeingRecords);
router.get('/:id', auth, getDyeingRecordById);

// Mutation routes (manager blocked by global read-only middleware)
router.post('/', auth, createDyeingRecord);
router.put('/:id', auth, updateDyeingRecord);
router.delete('/:id', auth, deleteDyeingRecord);

module.exports = router;
