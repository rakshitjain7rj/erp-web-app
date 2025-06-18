const { Op } = require('sequelize');
const DyeingRecord = require('../models/DyeingRecord');
const DyeingFollowUp = require('../models/DyeingFollowUp');

const getDyeingSummary = async (req, res, next) => {
  try {
    const allRecords = await DyeingRecord.findAll();

    const total = allRecords.length;

    const overdue = allRecords.filter(record =>
      !record.arrivalDate && new Date(record.dueDate) < new Date()
    ).length;

    const completed = allRecords.filter(record => !!record.arrivalDate).length;

    const dueInNext7Days = allRecords.filter(record => {
      const due = new Date(record.dueDate);
      const today = new Date();
      const in7Days = new Date();
      in7Days.setDate(today.getDate() + 7);
      return due >= today && due <= in7Days && !record.arrivalDate;
    }).length;

    // Fetch follow-ups count per dyeing record
    const followUps = await DyeingFollowUp.findAll();
    const followUpMap = {};

    followUps.forEach(fu => {
      followUpMap[fu.dyeingRecordId] = (followUpMap[fu.dyeingRecordId] || 0) + 1;
    });

    res.json({
      totalRecords: total,
      overdue,
      completed,
      dueInNext7Days,
      followUpCount: followUpMap,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDyeingSummary };
