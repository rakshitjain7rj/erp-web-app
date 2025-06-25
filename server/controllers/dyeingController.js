const asyncHandler = require("express-async-handler");
const DyeingRecord = require("../models/DyeingRecord");
const { sequelize } = require('../config/postgres');

// ✅ Create a new dyeing record
const createDyeingRecord = asyncHandler(async (req, res) => {
  const {
    yarnType, sentDate, expectedArrivalDate, remarks,
    partyName, quantity, shade, count, lot, dyeingFirm
  } = req.body;

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

// ✅ Update dyeing record
const updateDyeingRecord = asyncHandler(async (req, res) => {
  const {
    yarnType, sentDate, expectedArrivalDate, remarks,
    partyName, quantity, shade, count, lot, dyeingFirm
  } = req.body;

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

// ✅ Dyeing Summary (with optional date range filter)
const getDyeingSummary = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const whereClause = {};
  if (startDate || endDate) {
    whereClause.sentDate = {};
    if (startDate) {
      whereClause.sentDate['$gte'] = new Date(startDate);
    }
    if (endDate) {
      whereClause.sentDate['$lte'] = new Date(endDate);
    }
  }

  const records = await DyeingRecord.findAll({
    where: whereClause,
    attributes: [
      'id', 'yarnType', 'sentDate', 'expectedArrivalDate',
      'arrivalDate', 'isReprocessing'
    ],
    order: [['sentDate', 'DESC']]
  });

  const today = new Date();
  const summaryData = records.map((record) => {
    const expected = record.expectedArrivalDate ? new Date(record.expectedArrivalDate) : null;
    let status = "Pending";

    if (record.isReprocessing) status = "Reprocessing";
    else if (record.arrivalDate) status = "Arrived";

    return {
      id: record.id,
      product: record.yarnType,
      sentDate: record.sentDate,
      expectedArrival: record.expectedArrivalDate,
      status: status,
      isOverdue:
        expected &&
        !record.arrivalDate &&
        !record.isReprocessing &&
        today > expected,
    };
  });

  res.status(200).json(summaryData);
});

// ✅ Party-wise Dyeing Summary (with normalized grouping)
const getDyeingSummaryByParty = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  let whereClause = '';
  if (startDate && endDate) {
    whereClause = `WHERE "sentDate" BETWEEN '${startDate}' AND '${endDate}'`;
  } else if (startDate) {
    whereClause = `WHERE "sentDate" >= '${startDate}'`;
  } else if (endDate) {
    whereClause = `WHERE "sentDate" <= '${endDate}'`;
  }

  const [results] = await sequelize.query(`
    SELECT
      LOWER(TRIM("partyName")) AS "partyName",
      COUNT(*) AS "totalOrders",
      SUM(CASE WHEN "arrivalDate" IS NULL AND "isReprocessing" = false THEN 1 ELSE 0 END) AS "pendingOrders",
      SUM("quantity") AS "totalYarn",
      SUM(CASE 
        WHEN "isReprocessing" = true THEN "quantity" 
        WHEN "arrivalDate" IS NULL THEN "quantity" 
        ELSE 0 
      END) AS "pendingYarn",
      SUM(CASE WHEN "isReprocessing" = true THEN "quantity" ELSE 0 END) AS "reprocessingYarn",
      SUM(CASE WHEN "arrivalDate" IS NOT NULL AND "isReprocessing" = false THEN "quantity" ELSE 0 END) AS "arrivedYarn"
    FROM "DyeingRecords"
    ${whereClause}
    GROUP BY LOWER(TRIM("partyName"))
    ORDER BY "pendingOrders" DESC, "totalOrders" DESC;
  `);

  res.status(200).json(results);
});

// ✅ Mark for reprocessing
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

  if (isReprocessing) {
    record.arrivalDate = null;
  }

  await record.save();
  res.status(200).json(record);
});

module.exports = {
  createDyeingRecord,
  getAllDyeingRecords,
  getDyeingRecordById,
  updateDyeingRecord,
  updateArrivalDate,
  updateExpectedArrivalDate,
  deleteDyeingRecord,
  getDyeingSummary,
  markAsReprocessing,
  getDyeingSummaryByParty,
};
