// server/controllers/dyeingFirmController.js
const asyncHandler = require('express-async-handler');
const DyeingFirm = require('../models/DyeingFirm');

// GET all dyeing firms
const getAllDyeingFirms = asyncHandler(async (req, res) => {
  try {
    const dyeingFirms = await DyeingFirm.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']],
      attributes: ['id', 'name', 'contactPerson', 'phoneNumber', 'email', 'createdAt']
    });

    res.status(200).json({
      success: true,
      data: dyeingFirms,
      count: dyeingFirms.length
    });
  } catch (error) {
    console.error('Error fetching dyeing firms:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dyeing firms',
      error: error.message
    });
  }
});

// GET dyeing firm by ID
const getDyeingFirmById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const dyeingFirm = await DyeingFirm.findByPk(id);

    if (!dyeingFirm) {
      return res.status(404).json({
        success: false,
        message: 'Dyeing firm not found'
      });
    }

    res.status(200).json({
      success: true,
      data: dyeingFirm
    });
  } catch (error) {
    console.error('Error fetching dyeing firm:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dyeing firm',
      error: error.message
    });
  }
});

// POST create new dyeing firm
const createDyeingFirm = asyncHandler(async (req, res) => {
  const { name, contactPerson, phoneNumber, email, address, notes } = req.body;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Dyeing firm name is required'
    });
  }

  try {
    // Check if dyeing firm already exists (case-insensitive)
    const existingFirm = await DyeingFirm.findByNameIgnoreCase(name.trim());
    
    if (existingFirm) {
      return res.status(409).json({
        success: false,
        message: 'Dyeing firm with this name already exists',
        data: existingFirm
      });
    }

    // Create new dyeing firm
    const dyeingFirm = await DyeingFirm.create({
      name: name.trim(),
      contactPerson: contactPerson?.trim() || null,
      phoneNumber: phoneNumber?.trim() || null,
      email: email?.trim() || null,
      address: address?.trim() || null,
      notes: notes?.trim() || null,
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Dyeing firm created successfully',
      data: dyeingFirm
    });
  } catch (error) {
    console.error('Error creating dyeing firm:', error.message);
    
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
        message: 'Dyeing firm with this name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create dyeing firm',
      error: error.message
    });
  }
});

// PUT update dyeing firm
const updateDyeingFirm = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, contactPerson, phoneNumber, email, address, notes, isActive } = req.body;

  try {
    const dyeingFirm = await DyeingFirm.findByPk(id);

    if (!dyeingFirm) {
      return res.status(404).json({
        success: false,
        message: 'Dyeing firm not found'
      });
    }

    // If name is being updated, check for duplicates
    if (name && name.trim() !== dyeingFirm.name) {
      const existingFirm = await DyeingFirm.findByNameIgnoreCase(name.trim());
      if (existingFirm && existingFirm.id !== parseInt(id)) {
        return res.status(409).json({
          success: false,
          message: 'Dyeing firm with this name already exists'
        });
      }
    }

    // Update dyeing firm
    await dyeingFirm.update({
      name: name?.trim() || dyeingFirm.name,
      contactPerson: contactPerson?.trim() || dyeingFirm.contactPerson,
      phoneNumber: phoneNumber?.trim() || dyeingFirm.phoneNumber,
      email: email?.trim() || dyeingFirm.email,
      address: address?.trim() || dyeingFirm.address,
      notes: notes?.trim() || dyeingFirm.notes,
      isActive: isActive !== undefined ? isActive : dyeingFirm.isActive
    });

    res.status(200).json({
      success: true,
      message: 'Dyeing firm updated successfully',
      data: dyeingFirm
    });
  } catch (error) {
    console.error('Error updating dyeing firm:', error.message);
    
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
      message: 'Failed to update dyeing firm',
      error: error.message
    });
  }
});

// DELETE dyeing firm (soft delete by setting isActive to false)
const deleteDyeingFirm = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const dyeingFirm = await DyeingFirm.findByPk(id);

    if (!dyeingFirm) {
      return res.status(404).json({
        success: false,
        message: 'Dyeing firm not found'
      });
    }

    // Soft delete by setting isActive to false
    await dyeingFirm.update({ isActive: false });

    res.status(200).json({
      success: true,
      message: 'Dyeing firm deactivated successfully'
    });
  } catch (error) {
    console.error('Error deleting dyeing firm:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete dyeing firm',
      error: error.message
    });
  }
});

// POST find or create dyeing firm (used by forms)
const findOrCreateDyeingFirm = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Dyeing firm name is required'
    });
  }

  try {
    // Check if dyeing firm already exists (case-insensitive)
    let dyeingFirm = await DyeingFirm.findByNameIgnoreCase(name.trim());
    
    if (dyeingFirm) {
      // If inactive, reactivate it
      if (!dyeingFirm.isActive) {
        await dyeingFirm.update({ isActive: true });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Dyeing firm found',
        data: dyeingFirm,
        created: false
      });
    }

    // Create new dyeing firm
    dyeingFirm = await DyeingFirm.create({
      name: name.trim(),
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Dyeing firm created successfully',
      data: dyeingFirm,
      created: true
    });
  } catch (error) {
    console.error('Error finding or creating dyeing firm:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to find or create dyeing firm',
      error: error.message
    });
  }
});

module.exports = {
  getAllDyeingFirms,
  getDyeingFirmById,
  createDyeingFirm,
  updateDyeingFirm,
  deleteDyeingFirm,
  findOrCreateDyeingFirm,
};
