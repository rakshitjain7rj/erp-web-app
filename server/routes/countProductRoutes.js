// server/routes/countProductRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const { auth, readOnlyForManagers } = require('../middleware/authMiddleware');

// Controllers
const {
  getAllCountProducts,
  getCountProductById,
  createCountProduct,
  updateCountProduct,
  deleteCountProduct,
  getCountProductsByDyeingFirm,
} = require('../controllers/countProductController');

const {
  getFollowUpsByCountProductId,
  createCountProductFollowUp,
  deleteCountProductFollowUp,
} = require('../controllers/countProductFollowUpController');

// ===== 📦 Count Product CRUD Routes =====
router.get('/', auth, getAllCountProducts);                           // GET /api/count-products
router.get('/dyeing-firm/:dyeingFirm', auth, getCountProductsByDyeingFirm);  // GET /api/count-products/dyeing-firm/:dyeingFirm
router.get('/:id', auth, getCountProductById);                        // GET /api/count-products/:id
router.post('/', auth, readOnlyForManagers, createCountProduct);                          // POST /api/count-products
router.put('/:id', auth, readOnlyForManagers, updateCountProduct);                   // PUT /api/count-products/:id
router.delete('/:id', auth, readOnlyForManagers, deleteCountProduct);                // DELETE /api/count-products/:id

// ===== 💬 Follow-Up Routes =====
router.get('/:countProductId/followups', auth, getFollowUpsByCountProductId);
router.post('/:countProductId/followups', auth, readOnlyForManagers, createCountProductFollowUp);
router.delete('/:countProductId/followups/:followUpId', auth, readOnlyForManagers, deleteCountProductFollowUp);

module.exports = router;
