const asyncHandler = require('express-async-handler');
const DyeingFollowUp = require('../models/DyeingFollowUp');

// GET follow-ups by dyeingRecordId
const getFollowUpsByRecordId = asyncHandler(async (req, res) => {
  const { dyeingRecordId } = req.params;

  const followUps = await DyeingFollowUp.findAll({
    where: { dyeingRecordId },
    order: [['followUpDate', 'DESC']],
  });

  res.status(200).json(followUps);
});

// POST a follow-up to a dyeingRecord
const createFollowUp = asyncHandler(async (req, res) => {
  const { dyeingRecordId } = req.params;
  const { followUpDate, remarks } = req.body;

  if (!followUpDate) {
    return res.status(400).json({ message: 'followUpDate is required' });
  }

  const followUp = await DyeingFollowUp.create({
    dyeingRecordId,
    followUpDate,
    remarks,
  });

  res.status(201).json(followUp);
});

module.exports = {
  getFollowUpsByRecordId,
  createFollowUp,
};
