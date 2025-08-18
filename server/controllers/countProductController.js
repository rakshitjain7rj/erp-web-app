// server/controllers/countProductController.js
const asyncHandler = require('express-async-handler');
const CountProduct = require('../models/CountProduct');

// GET all count products
const getAllCountProducts = asyncHandler(async (req, res) => {
  try {
    const countProducts = await CountProduct.findAll({
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: countProducts,
      count: countProducts.length
    });
  } catch (error) {
    console.error('Error fetching count products:', error.message);
    
    // If table doesn't exist, return empty array instead of error
    if (error.message.includes('does not exist') || error.message.includes('CountProducts')) {
      console.log('📊 CountProducts table not found, returning empty data');
      res.status(200).json({
        success: true,
        data: [],
        count: 0,
        message: 'CountProducts table not initialized - using fallback'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch count products',
        error: error.message
      });
    }
  }
});

// GET count product by ID
const getCountProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const countProduct = await CountProduct.findByPk(id);

    if (!countProduct) {
      return res.status(404).json({
        success: false,
        message: 'Count product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: countProduct
    });
  } catch (error) {
    console.error('Error fetching count product:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch count product',
      error: error.message
    });
  }
});

// POST create new count product
const createCountProduct = asyncHandler(async (req, res) => {
  try {
    const countProduct = await CountProduct.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Count product created successfully',
      data: countProduct
    });
  } catch (error) {
    console.error('Error creating count product:', error.message);
    
    // Handle validation errors
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Handle unique constraint errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Count product with this lot number already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create count product',
      error: error.message
    });
  }
});

// PUT update count product
const updateCountProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const countProduct = await CountProduct.findByPk(id);

    if (!countProduct) {
      return res.status(404).json({
        success: false,
        message: 'Count product not found'
      });
    }

    await countProduct.update(req.body);

    res.status(200).json({
      success: true,
      message: 'Count product updated successfully',
      data: countProduct
    });
  } catch (error) {
    console.error('Error updating count product:', error.message);
    
    // Handle validation errors
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update count product',
      error: error.message
    });
  }
});

// DELETE count product
const deleteCountProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const countProduct = await CountProduct.findByPk(id);

    if (!countProduct) {
      return res.status(404).json({
        success: false,
        message: 'Count product not found'
      });
    }

    await countProduct.destroy();

    res.status(200).json({
      success: true,
      message: 'Count product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting count product:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete count product',
      error: error.message
    });
  }
});

// GET count products by dyeing firm
const getCountProductsByDyeingFirm = asyncHandler(async (req, res) => {
  const { dyeingFirm } = req.params;

  try {
    const countProducts = await CountProduct.findAll({
      where: { dyeingFirm },
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: countProducts,
      count: countProducts.length
    });
  } catch (error) {
    console.error('Error fetching count products by dyeing firm:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch count products',
      error: error.message
    });
  }
});

module.exports = {
  getAllCountProducts,
  getCountProductById,
  createCountProduct,
  updateCountProduct,
  deleteCountProduct,
  getCountProductsByDyeingFirm,
};
