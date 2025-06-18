const asyncHandler = require('express-async-handler');
const DyeingRecord = require('../models/DyeingRecord');

// Create a new dyeing record
const createDyeingRecord = asyncHandler(async (req, res) => {
  const record = await DyeingRecord.create(req.body);
  res.status(201).json(record);
});

// Get all dyeing records
const getAllDyeingRecords = asyncHandler(async (req, res) => {
  const records = await DyeingRecord.findAll();
  res.status(200).json(records);
});

// Get single dyeing record by ID
const getDyeingRecordById = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const record = await DyeingRecord.findByPk(id);

  if (!record) {
    return res.status(404).json({ error: 'Dyeing record not found' });
  }

  res.status(200).json(record);
});

// Update arrival date and isOverdue
const updateArrivalDate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { arrivalDate } = req.body;

  if (!arrivalDate) {
    return res.status(400).json({ message: 'Arrival date is required' });
  }

  const record = await DyeingRecord.findByPk(id);
  if (!record) {
    return res.status(404).json({ message: 'Dyeing record not found' });
  }

  record.arrivalDate = arrivalDate;

  // Check if overdue: arrivalDate > sentDate
  const sentDate = new Date(record.sentDate);
  const arrival = new Date(arrivalDate);
  record.isOverdue = arrival > sentDate;

  await record.save();

  res.status(200).json({ message: 'Arrival date updated', record });
});

module.exports = {
  createDyeingRecord,
  getAllDyeingRecords,
  getDyeingRecordById,
  updateArrivalDate,
};
