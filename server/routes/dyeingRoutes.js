const express = require('express');
const router = express.Router({ mergeParams: true });

// Controllers
const {
  createDyeingRecord,
  getAllDyeingRecords,
  getDyeingRecordById,
  updateDyeingRecord,
  deleteDyeingRecord,
} = require('../controllers/dyeingController');

// ===== 📋 Basic CRUD Routes =====
router.post('/', createDyeingRecord);
router.get('/', getAllDyeingRecords);
router.get('/:id', getDyeingRecordById);
router.put('/:id', updateDyeingRecord);
router.delete('/:id', deleteDyeingRecord);

module.exports = router;
