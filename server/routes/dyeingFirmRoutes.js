// server/routes/dyeingFirmRoutes.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/authMiddleware');

// Controllers
const {
  getAllDyeingFirms,
  getDyeingFirmById,
  createDyeingFirm,
  updateDyeingFirm,
  deleteDyeingFirm,
  findOrCreateDyeingFirm,
} = require('../controllers/dyeingFirmController');

// ===== 🏭 Dyeing Firm CRUD Routes =====
router.get('/', getAllDyeingFirms);                           // GET /api/dyeing-firms
router.post('/', createDyeingFirm);                           // POST /api/dyeing-firms (removed auth for testing)
router.post('/find-or-create', findOrCreateDyeingFirm);       // POST /api/dyeing-firms/find-or-create (removed auth for testing)
router.get('/:id', getDyeingFirmById);                        // GET /api/dyeing-firms/:id
router.put('/:id', auth, updateDyeingFirm);                   // PUT /api/dyeing-firms/:id
router.delete('/:id', auth, deleteDyeingFirm);                // DELETE /api/dyeing-firms/:id

module.exports = router;
