const asyncHandler = require("express-async-handler");

// Mock data storage (in-memory)
let dyeingFirms = [
  { id: 1, name: "Test Firm", contactPerson: "Manager", phoneNumber: null, email: null, createdAt: new Date().toISOString() },
  { id: 2, name: "ABC Dyeing", contactPerson: "Admin", phoneNumber: null, email: null, createdAt: new Date().toISOString() },
  { id: 3, name: "XYZ Colors", contactPerson: "Supervisor", phoneNumber: null, email: null, createdAt: new Date().toISOString() }
];
let nextFirmId = 4;

// ✅ Get all dyeing firms (mock mode)
const getAllDyeingFirms = asyncHandler(async (req, res) => {
  try {
    console.log('📋 Fetching all dyeing firms (MOCK MODE)');
    res.status(200).json({
      success: true,
      data: dyeingFirms,
      count: dyeingFirms.length,
      message: "Firms loaded from mock data"
    });
  } catch (error) {
    console.error('❌ Error fetching dyeing firms:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch dyeing firms', 
      error: error.message 
    });
  }
});

// ✅ Create a new dyeing firm (mock mode)
const createDyeingFirm = asyncHandler(async (req, res) => {
  try {
    const { name, contactPerson, phoneNumber, email } = req.body;

    console.log('🎯 Creating dyeing firm (MOCK MODE) with data:', req.body);

    const newFirm = {
      id: nextFirmId++,
      name,
      contactPerson: contactPerson || "Manager",
      phoneNumber: phoneNumber || null,
      email: email || null,
      createdAt: new Date().toISOString()
    };

    dyeingFirms.push(newFirm);

    console.log('✅ Dyeing firm created successfully (MOCK):', newFirm);
    res.status(201).json(newFirm);

  } catch (error) {
    console.error('❌ Error creating dyeing firm:', error.message);
    res.status(500).json({ 
      message: 'Failed to create dyeing firm', 
      error: error.message 
    });
  }
});

// ✅ Find or create dyeing firm (mock mode)
const findOrCreateDyeingFirm = asyncHandler(async (req, res) => {
  try {
    const { name } = req.body;

    console.log('🔍 Finding or creating dyeing firm (MOCK MODE):', name);

    // Try to find existing firm
    let existingFirm = dyeingFirms.find(firm => 
      firm.name.toLowerCase() === name.toLowerCase()
    );

    if (existingFirm) {
      console.log('✅ Found existing firm:', existingFirm);
      res.status(200).json(existingFirm);
    } else {
      // Create new firm
      const newFirm = {
        id: nextFirmId++,
        name,
        contactPerson: "Manager",
        phoneNumber: null,
        email: null,
        createdAt: new Date().toISOString()
      };

      dyeingFirms.push(newFirm);

      console.log('✅ Created new firm:', newFirm);
      res.status(201).json(newFirm);
    }

  } catch (error) {
    console.error('❌ Error finding/creating dyeing firm:', error.message);
    res.status(500).json({ 
      message: 'Failed to find or create dyeing firm', 
      error: error.message 
    });
  }
});

// ✅ Get dyeing firm by ID (mock mode)
const getDyeingFirmById = asyncHandler(async (req, res) => {
  try {
    const firm = dyeingFirms.find(f => f.id === parseInt(req.params.id));

    if (!firm) {
      return res.status(404).json({ message: "Dyeing firm not found" });
    }

    res.status(200).json(firm);
  } catch (error) {
    console.error('❌ Error fetching dyeing firm:', error.message);
    res.status(500).json({ 
      message: 'Failed to fetch dyeing firm', 
      error: error.message 
    });
  }
});

// ✅ Update dyeing firm (mock mode)
const updateDyeingFirm = asyncHandler(async (req, res) => {
  try {
    const { name, contactPerson, phoneNumber, email } = req.body;

    const firmIndex = dyeingFirms.findIndex(f => f.id === parseInt(req.params.id));

    if (firmIndex === -1) {
      return res.status(404).json({ message: "Dyeing firm not found" });
    }

    // Update the firm
    dyeingFirms[firmIndex] = {
      ...dyeingFirms[firmIndex],
      name,
      contactPerson,
      phoneNumber,
      email,
      updatedAt: new Date().toISOString()
    };

    res.status(200).json(dyeingFirms[firmIndex]);
  } catch (error) {
    console.error('❌ Error updating dyeing firm:', error.message);
    res.status(500).json({ 
      message: 'Failed to update dyeing firm', 
      error: error.message 
    });
  }
});

// ✅ Delete dyeing firm (mock mode)
const deleteDyeingFirm = asyncHandler(async (req, res) => {
  try {
    const firmIndex = dyeingFirms.findIndex(f => f.id === parseInt(req.params.id));

    if (firmIndex === -1) {
      return res.status(404).json({ message: "Dyeing firm not found" });
    }

    dyeingFirms.splice(firmIndex, 1);
    res.status(200).json({ message: "Dyeing firm deleted successfully" });
  } catch (error) {
    console.error('❌ Error deleting dyeing firm:', error.message);
    res.status(500).json({ 
      message: 'Failed to delete dyeing firm', 
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
