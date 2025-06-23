const asyncHandler = require("express-async-handler");
const DyeingRecord = require("../models/DyeingRecord");
const { sequelize } = require('../config/postgres');


// ✅ Create a new dyeing record
const createDyeingRecord = asyncHandler(async (req, res) => {
  const { yarnType, sentDate, expectedArrivalDate, remarks, partyName, quantity, shade, count, lot, dyeingFirm } = req.body;

  const newRecord = await DyeingRecord.create({
    yarnType,
    sentDate,
    expectedArrivalDate,
    remarks,
    partyName,
    quantity,
    shade,
    count,
    lot,
    dyeingFirm,
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

// ✅ Update a dyeing record (yarnType, sentDate, expectedArrivalDate, remarks, partyName, quantity, shade, count, lot, dyeingFirm)
const updateDyeingRecord = asyncHandler(async (req, res) => {
  const { yarnType, sentDate, expectedArrivalDate, remarks, partyName, quantity, shade, count, lot, dyeingFirm } = req.body;
  const record = await DyeingRecord.findByPk(req.params.id);

  if (!record) {
    res.status(404);
    throw new Error("Dyeing record not found");
  }

  record.yarnType = yarnType || record.yarnType;
  record.sentDate = sentDate || record.sentDate;
  record.expectedArrivalDate = expectedArrivalDate || record.expectedArrivalDate;
  record.remarks = remarks || record.remarks;
  record.partyName = partyName || record.partyName;
  record.quantity = quantity || record.quantity;
  record.shade = shade || record.shade;
  record.count = count || record.count;
  record.lot = lot || record.lot;
  record.dyeingFirm = dyeingFirm || record.dyeingFirm;

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
      'arrivalDate',
      'isReprocessing'
    ],
    order: [['sentDate', 'DESC']]
  });
  const summaryData = records.map((record) => {
    const today = new Date();
    const expected = record.expectedArrivalDate ? new Date(record.expectedArrivalDate) : null;

    let status = "Pending";
    if (record.isReprocessing) {
      status = "Reprocessing";
    } else if (record.arrivalDate) {
      status = "Arrived";
    }

    return {
      id: record.id,
      product: record.yarnType,
      sentDate: record.sentDate,
      expectedArrival: record.expectedArrivalDate,
      status: status,
      isOverdue: expected && !record.arrivalDate && !record.isReprocessing && today > expected,
    };
  });

  res.status(200).json(summaryData);
});

// ✅ Mark record for reprocessing
const markAsReprocessing = asyncHandler(async (req, res) => {
  const { isReprocessing, reprocessingDate, reprocessingReason } = req.body;
  const record = await DyeingRecord.findByPk(req.params.id);

  if (!record) {
    res.status(404);
    throw new Error("Dyeing record not found");
  }

  record.isReprocessing = isReprocessing;
  record.reprocessingDate = reprocessingDate || null;
  record.reprocessingReason = reprocessingReason || null;

  // If marking for reprocessing, clear the arrival date
  if (isReprocessing) {
    record.arrivalDate = null;
  }

  await record.save();
  res.status(200).json(record);
});

const getDyeingSummaryByParty = asyncHandler(async (req, res) => {
  const [results] = await sequelize.query(`
    SELECT
      "partyName",
      COUNT(*) AS "totalOrders",
      SUM("quantity") AS "totalYarn",
      SUM(CASE 
        WHEN "isReprocessing" = true THEN "quantity" 
        WHEN "arrivalDate" IS NULL THEN "quantity" 
        ELSE 0 
      END) AS "pendingYarn",
      SUM(CASE WHEN "isReprocessing" = true THEN "quantity" ELSE 0 END) AS "reprocessingYarn",
      SUM(CASE WHEN "arrivalDate" IS NOT NULL AND "isReprocessing" = false THEN "quantity" ELSE 0 END) AS "arrivedYarn"
    FROM "DyeingRecords"
    GROUP BY "partyName"
    ORDER BY "partyName";
  `);

  res.status(200).json(results);
});


module.exports = {
  createDyeingRecord,
  getAllDyeingRecords,
  getDyeingRecordById,
  updateDyeingRecord, // ✅ export added
  updateArrivalDate,
  updateExpectedArrivalDate,
  deleteDyeingRecord,
  getDyeingSummary,
  markAsReprocessing,
  getDyeingSummaryByParty
};
