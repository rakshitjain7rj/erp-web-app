const asyncHandler = require('express-async-handler');
const DyeingRecord = require('../models/DyeingRecord');

// Create a new dyeing record
const createDyeingRecord = asyncHandler(async (req, res) => {
  // Validate required fields
  const { yarnType, sentDate, expectedArrivalDate } = req.body;
  
  if (!yarnType || !sentDate || !expectedArrivalDate) {
    return res.status(400).json({ 
      message: 'yarnType, sentDate, and expectedArrivalDate are required' 
    });
  }

  const record = await DyeingRecord.create(req.body);
  res.status(201).json(record);
});

// Get all dyeing records with overdue status
const getAllDyeingRecords = asyncHandler(async (req, res) => {
  const records = await DyeingRecord.findAll({
    order: [['createdAt', 'DESC']]
  });
  
  // Add overdue status to each record (calculated manually)
  const recordsWithStatus = records.map(record => {
    const today = new Date();
    const expectedDate = new Date(record.expectedArrivalDate);
    const hasArrived = record.arrivalDate !== null;
    const isOverdue = today > expectedDate && !hasArrived;
    
    return {
      ...record.toJSON(),
      isOverdue
    };
  });
  
  res.status(200).json(recordsWithStatus);
});

// Get single dyeing record by ID
const getDyeingRecordById = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const record = await DyeingRecord.findByPk(id);

  if (!record) {
    return res.status(404).json({ error: 'Dyeing record not found' });
  }

  // Add overdue status (calculated manually)
  const today = new Date();
  const expectedDate = new Date(record.expectedArrivalDate);
  const hasArrived = record.arrivalDate !== null;
  const isOverdue = today > expectedDate && !hasArrived;

  const recordWithStatus = {
    ...record.toJSON(),
    isOverdue
  };

  res.status(200).json(recordWithStatus);
});

// Update your updateArrivalDate function in dyeingController.js:

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

  // Ensure the date is properly formatted
  const formattedDate = new Date(arrivalDate).toISOString();
  record.arrivalDate = formattedDate;
  await record.save();

  // Calculate overdue status for response
  const today = new Date();
  const expectedDate = new Date(record.expectedArrivalDate);
  const hasArrived = record.arrivalDate !== null;
  const isOverdue = today > expectedDate && !hasArrived;

  // Return the complete updated record - IMPORTANT: match frontend expectations
  const updatedRecord = {
    id: record.id,
    yarnType: record.yarnType,
    sentDate: record.sentDate,
    expectedArrivalDate: record.expectedArrivalDate,
    arrivalDate: record.arrivalDate, // This should now be properly formatted
    remarks: record.remarks,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    isOverdue
  };

  // Return just the record object, not wrapped in message + record
  res.status(200).json(updatedRecord);
});

// Update expected arrival date
const updateExpectedArrivalDate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { expectedArrivalDate } = req.body;

  if (!expectedArrivalDate) {
    return res.status(400).json({ message: 'Expected arrival date is required' });
  }

  const record = await DyeingRecord.findByPk(id);
  if (!record) {
    return res.status(404).json({ message: 'Dyeing record not found' });
  }

  record.expectedArrivalDate = expectedArrivalDate;
  await record.save();

  // Calculate overdue status for response
  const today = new Date();
  const expectedDate = new Date(record.expectedArrivalDate);
  const hasArrived = record.arrivalDate !== null;
  const isOverdue = today > expectedDate && !hasArrived;

  const updatedRecord = {
    ...record.toJSON(),
    isOverdue
  };

  res.status(200).json({ 
    message: 'Expected arrival date updated successfully', 
    record: updatedRecord 
  });
});

// Delete a dyeing record
const deleteDyeingRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const record = await DyeingRecord.findByPk(id);
  if (!record) {
    return res.status(404).json({ message: 'Dyeing record not found' });
  }

  await record.destroy();
  
  res.status(200).json({ 
    message: 'Dyeing record deleted successfully' 
  });
});


module.exports = {
  createDyeingRecord,
  getAllDyeingRecords,
  getDyeingRecordById,
  updateArrivalDate,
  updateExpectedArrivalDate,
  deleteDyeingRecord
};