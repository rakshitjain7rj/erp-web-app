const asyncHandler = require('express-async-handler');
const { Op } = require('sequelize');
const DyeingRecord = require('../models/DyeingRecord');
const DyeingFollowUp = require('../models/DyeingFollowUp');

// GET /api/dyeing/summary
const getDyeingSummary = asyncHandler(async (req, res) => {
  const today = new Date();
  const in7Days = new Date();
  in7Days.setDate(today.getDate() + 7);

  // Fetch all dyeing records
  const allRecords = await DyeingRecord.findAll();
  const total = allRecords.length;

  const overdue = allRecords.filter(record =>
    !record.arrivalDate && new Date(record.dueDate) < today
  ).length;

  const completed = allRecords.filter(record => !!record.arrivalDate).length;

  const dueInNext7Days = allRecords.filter(record => {
    const due = new Date(record.dueDate);
    return due >= today && due <= in7Days && !record.arrivalDate;
  }).length;

  // Get follow-up counts grouped by dyeing record
  const followUps = await DyeingFollowUp.findAll();
  const followUpMap = {};

  followUps.forEach(fu => {
    const recordId = fu.dyeingRecordId;
    followUpMap[recordId] = (followUpMap[recordId] || 0) + 1;
  });

  // Group dyeing records by status (optional enhancement)
  const summaryByStatus = {
    pending: allRecords.filter(r => !r.arrivalDate && new Date(r.dueDate) >= today).length,
    completed,
    overdue,
  };

  res.status(200).json({
    totalRecords: total,
    overdue,
    completed,
    dueInNext7Days,
    followUpCount: followUpMap,
    statusBreakdown: summaryByStatus,
  });
});

module.exports = { getDyeingSummary };
