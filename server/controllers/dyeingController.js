const asyncHandler = require("express-async-handler");
const DyeingRecord = require("../models/DyeingRecord");

// ✅ Create a new dyeing record
const createDyeingRecord = asyncHandler(async (req, res) => {
  const { yarnType, sentDate, expectedArrivalDate, remarks } = req.body;

  const newRecord = await DyeingRecord.create({
    yarnType,
    sentDate,
    expectedArrivalDate,
    remarks,
  });

  res.status(201).json(newRecord);
});

// ✅ Get all dyeing records
const getAllDyeingRecords = asyncHandler(async (req, res) => {
  const records = await DyeingRecord.findAll();
  res.status(200).json(records);
});

// ✅ Get dyeing record by ID
const getDyeingRecordById = asyncHandler(async (req, res) => {
  const record = await DyeingRecord.findByPk(req.params.id);
  if (!record) {
    res.status(404);
    throw new Error("Dyeing record not found");
  }
  res.status(200).json(record);
});

// ✅ Update a dyeing record (yarnType, sentDate, expectedArrivalDate, remarks)
const updateDyeingRecord = asyncHandler(async (req, res) => {
  const { yarnType, sentDate, expectedArrivalDate, remarks } = req.body;
  const record = await DyeingRecord.findByPk(req.params.id);

  if (!record) {
    res.status(404);
    throw new Error("Dyeing record not found");
  }

  record.yarnType = yarnType || record.yarnType;
  record.sentDate = sentDate || record.sentDate;
  record.expectedArrivalDate = expectedArrivalDate || record.expectedArrivalDate;
  record.remarks = remarks || record.remarks;

  await record.save();
  res.status(200).json(record);
});

// ✅ Update arrival date
const updateArrivalDate = asyncHandler(async (req, res) => {
  const { arrivalDate } = req.body;
  const record = await DyeingRecord.findByPk(req.params.id);

  if (!record) {
    res.status(404);
    throw new Error("Record not found");
  }

  record.arrivalDate = arrivalDate;
  await record.save();
  res.json(record);
});

// ✅ Update expected arrival date
const updateExpectedArrivalDate = asyncHandler(async (req, res) => {
  const { expectedArrivalDate } = req.body;
  const record = await DyeingRecord.findByPk(req.params.id);

  if (!record) {
    res.status(404);
    throw new Error("Record not found");
  }

  record.expectedArrivalDate = expectedArrivalDate;
  await record.save();
  res.json(record);
});

// ✅ Delete dyeing record
const deleteDyeingRecord = asyncHandler(async (req, res) => {
  const record = await DyeingRecord.findByPk(req.params.id);
  if (!record) {
    res.status(404);
    throw new Error("Record not found");
  }
  await record.destroy();
  res.json({ message: "Record deleted" });
});

// ✅ GET dyeing summary - used in DyeingSummary.tsx
const getDyeingSummary = asyncHandler(async (req, res) => {
  const records = await DyeingRecord.findAll({
    attributes: [
      'id',
      'yarnType',
      'sentDate',
      'expectedArrivalDate',
      'arrivalDate'
    ],
    order: [['sentDate', 'DESC']]
  });

  const summaryData = records.map((record) => {
    const today = new Date();
    const expected = record.expectedArrivalDate ? new Date(record.expectedArrivalDate) : null;

    return {
      id: record.id,
      product: record.yarnType,
      sentDate: record.sentDate,
      expectedArrival: record.expectedArrivalDate,
      status: record.arrivalDate ? "Arrived" : "Pending",
      isOverdue: expected && !record.arrivalDate && today > expected,
    };
  });

  res.status(200).json(summaryData);
});

module.exports = {
  createDyeingRecord,
  getAllDyeingRecords,
  getDyeingRecordById,
  updateDyeingRecord, // ✅ export added
  updateArrivalDate,
  updateExpectedArrivalDate,
  deleteDyeingRecord,
  getDyeingSummary
};
