// server/routes/countProductRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const { auth } = require('../middleware/authMiddleware');

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
router.get('/', getAllCountProducts);                           // GET /api/count-products
router.post('/', createCountProduct);                          // POST /api/count-products (removed auth for testing)
router.get('/dyeing-firm/:dyeingFirm', getCountProductsByDyeingFirm);  // GET /api/count-products/dyeing-firm/:dyeingFirm
router.get('/:id', getCountProductById);                        // GET /api/count-products/:id
router.put('/:id', auth, updateCountProduct);                   // PUT /api/count-products/:id
router.delete('/:id', auth, deleteCountProduct);                // DELETE /api/count-products/:id

// ===== 💬 Follow-Up Routes =====
router.get('/:countProductId/followups', getFollowUpsByCountProductId);
router.post('/:countProductId/followups', auth, createCountProductFollowUp);
router.delete('/:countProductId/followups/:followUpId', auth, deleteCountProductFollowUp);

module.exports = router;
