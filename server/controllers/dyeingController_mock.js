const asyncHandler = require("express-async-handler");

// Mock data storage (in-memory)
let dyeingRecords = [];
let nextId = 1;

// ✅ Create a new dyeing record (mock mode)
const createDyeingRecord = asyncHandler(async (req, res) => {
  try {
    const {
      yarnType, sentDate, expectedArrivalDate, remarks,
      partyName, quantity, shade, count, lot, dyeingFirm
    } = req.body;

    console.log('🎯 Creating dyeing record (MOCK MODE) with data:', req.body);

    // Create mock record
    const newRecord = {
      id: nextId++,
      yarnType,
      sentDate,
      expectedArrivalDate,
      arrivalDate: null,
      partyName,
      quantity: parseFloat(quantity),
      shade,
      count,
      lot,
      dyeingFirm,
      remarks,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    dyeingRecords.push(newRecord);

    console.log('✅ Dyeing record created successfully (MOCK):', newRecord);
    res.status(201).json(newRecord);

  } catch (error) {
    console.error('❌ Error creating dyeing record:', error.message);
    res.status(500).json({ 
      message: 'Failed to create dyeing record', 
      error: error.message 
    });
  }
});

// ✅ Get all dyeing records (mock mode)
const getAllDyeingRecords = asyncHandler(async (req, res) => {
  try {
    console.log('📋 Fetching all dyeing records (MOCK MODE)');
    res.status(200).json(dyeingRecords);
  } catch (error) {
    console.error('❌ Error fetching dyeing records:', error.message);
    res.status(500).json({ 
      message: 'Failed to fetch dyeing records', 
      error: error.message 
    });
  }
});

// ✅ Get dyeing record by ID (mock mode)
const getDyeingRecordById = asyncHandler(async (req, res) => {
  try {
    const record = dyeingRecords.find(r => r.id === parseInt(req.params.id));

    if (!record) {
      return res.status(404).json({ message: "Dyeing record not found" });
    }

    res.status(200).json(record);
  } catch (error) {
    console.error('❌ Error fetching dyeing record:', error.message);
    res.status(500).json({ 
      message: 'Failed to fetch dyeing record', 
      error: error.message 
    });
  }
});

// ✅ Update dyeing record (mock mode)
const updateDyeingRecord = asyncHandler(async (req, res) => {
  try {
    const {
      yarnType, sentDate, expectedArrivalDate, remarks,
      partyName, quantity, shade, count, lot, dyeingFirm
    } = req.body;

    const recordIndex = dyeingRecords.findIndex(r => r.id === parseInt(req.params.id));

    if (recordIndex === -1) {
      return res.status(404).json({ message: "Dyeing record not found" });
    }

    // Update the record
    dyeingRecords[recordIndex] = {
      ...dyeingRecords[recordIndex],
      yarnType,
      sentDate,
      expectedArrivalDate,
      partyName,
      quantity: parseFloat(quantity),
      shade,
      count,
      lot,
      dyeingFirm,
      remarks,
      updatedAt: new Date().toISOString()
    };

    res.status(200).json(dyeingRecords[recordIndex]);
  } catch (error) {
    console.error('❌ Error updating dyeing record:', error.message);
    res.status(500).json({ 
      message: 'Failed to update dyeing record', 
      error: error.message 
    });
  }
});

// ✅ Delete dyeing record (mock mode)
const deleteDyeingRecord = asyncHandler(async (req, res) => {
  try {
    const recordIndex = dyeingRecords.findIndex(r => r.id === parseInt(req.params.id));

    if (recordIndex === -1) {
      return res.status(404).json({ message: "Dyeing record not found" });
    }

    dyeingRecords.splice(recordIndex, 1);
    res.status(200).json({ message: "Dyeing record deleted successfully" });
  } catch (error) {
    console.error('❌ Error deleting dyeing record:', error.message);
    res.status(500).json({ 
      message: 'Failed to delete dyeing record', 
      error: error.message 
    });
  }
});

module.exports = {
  createDyeingRecord,
  getAllDyeingRecords,
  getDyeingRecordById,
  updateDyeingRecord,
  deleteDyeingRecord,
};
