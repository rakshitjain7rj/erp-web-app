const asyncHandler = require('express-async-handler');
const DyeingRecord = require('../models/DyeingRecord');
const { Op } = require('sequelize');

// GET /api/dyeing-alerts/due-alerts
exports.getDueAlerts = asyncHandler(async (req, res) => {
  const today = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(today.getDate() + 3);

  const dueSoon = await DyeingRecord.findAll({
    where: {
      arrivalDate: {
        [Op.gte]: today,
        [Op.lte]: threeDaysFromNow,
      },
      isOverdue: false,
    },
  });

  const overdue = await DyeingRecord.findAll({
    where: {
      arrivalDate: {
        [Op.lt]: today,
      },
      isOverdue: false,
    },
  });

  res.status(200).json({ dueSoon, overdue });
});

// GET /api/dyeing-alerts/overdue
exports.getOverdueDyeing = asyncHandler(async (req, res) => {
  const today = new Date();

  const overdue = await DyeingRecord.findAll({
    where: {
      arrivalDate: {
        [Op.lt]: today,
      },
      isOverdue: true 
    }
  });

  res.status(200).json(overdue);
});
