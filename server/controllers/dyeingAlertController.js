const asyncHandler = require('express-async-handler');
const DyeingRecord = require('../models/DyeingRecord');
const { Op } = require('sequelize');

// GET /api/dyeing-alerts/due-alerts
exports.getDueAlerts = asyncHandler(async (req, res) => {
  const today = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(today.getDate() + 3);

  // Records due soon (expected arrival in next 3 days and not yet arrived)
  const dueSoon = await DyeingRecord.findAll({
    where: {
      expectedArrivalDate: {
        [Op.gte]: today,
        [Op.lte]: threeDaysFromNow,
      },
      arrivalDate: null, // Not yet arrived
    },
    order: [['expectedArrivalDate', 'ASC']]
  });

  // Records that are overdue (expected arrival date passed and not yet arrived)
  const overdue = await DyeingRecord.findAll({
    where: {
      expectedArrivalDate: {
        [Op.lt]: today,
      },
      arrivalDate: null, // Not yet arrived
    },
    order: [['expectedArrivalDate', 'ASC']]
  });

  // Add overdue status to each record (calculated manually)
  const dueSoonWithStatus = dueSoon.map(record => {
    const today = new Date();
    const expectedDate = new Date(record.expectedArrivalDate);
    const hasArrived = record.arrivalDate !== null;
    const isOverdue = today > expectedDate && !hasArrived;
    
    return {
      ...record.toJSON(),
      isOverdue
    };
  });

  const overdueWithStatus = overdue.map(record => {
    const today = new Date();
    const expectedDate = new Date(record.expectedArrivalDate);
    const hasArrived = record.arrivalDate !== null;
    const isOverdue = today > expectedDate && !hasArrived;
    
    return {
      ...record.toJSON(),
      isOverdue
    };
  });

  res.status(200).json({ 
    dueSoon: dueSoonWithStatus, 
    overdue: overdueWithStatus 
  });
});

// GET /api/dyeing-alerts/overdue
exports.getOverdueDyeing = asyncHandler(async (req, res) => {
  const today = new Date();

  // Records that are overdue (expected arrival date passed and not yet arrived)
  const overdue = await DyeingRecord.findAll({
    where: {
      expectedArrivalDate: {
        [Op.lt]: today,
      },
      arrivalDate: null, // Not yet arrived
    },
    order: [['expectedArrivalDate', 'ASC']]
  });

  // Add overdue status to each record (calculated manually)
  const overdueWithStatus = overdue.map(record => {
    const today = new Date();
    const expectedDate = new Date(record.expectedArrivalDate);
    const hasArrived = record.arrivalDate !== null;
    const isOverdue = today > expectedDate && !hasArrived;
    
    return {
      ...record.toJSON(),
      isOverdue
    };
  });

  res.status(200).json(overdueWithStatus);
});

// GET /api/dyeing-alerts/arrived
exports.getArrivedDyeing = asyncHandler(async (req, res) => {
  const arrived = await DyeingRecord.findAll({
    where: {
      arrivalDate: {
        [Op.not]: null, // Has arrived
      },
    },
    order: [['arrivalDate', 'DESC']]
  });

  res.status(200).json(arrived);
});