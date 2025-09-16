const express = require('express');
const router = express.Router();
const controller = require('../controllers/productController');
const { auth } = require('../middleware/authMiddleware');

router.get('/', auth, controller.getAll);
router.post('/', auth, controller.create); // blocked for managers by global read-only

module.exports = router;

