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
  const user = req.user; // From auth middleware

  if (!followUpDate) {
    return res.status(400).json({ message: 'followUpDate is required' });
  }

  if (!remarks || !remarks.trim()) {
    return res.status(400).json({ message: 'Remarks are required' });
  }

  // Ensure we have user info from authentication
  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Debug logging
  console.log('Authenticated user:', user);

  // Create follow-up with authenticated user info
  const followUpData = {
    dyeingRecordId,
    followUpDate,
    remarks: remarks.trim(),
    addedBy: user.id,
    addedByName: user.name,
  };

  console.log('Creating follow-up with data:', followUpData);

  const followUp = await DyeingFollowUp.create(followUpData);

  res.status(201).json(followUp);
});

// DELETE a follow-up
const deleteFollowUp = asyncHandler(async (req, res) => {
  const { dyeingRecordId, followUpId } = req.params;
  const user = req.user;

  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Find the follow-up
  const followUp = await DyeingFollowUp.findOne({
    where: { 
      id: followUpId, 
      dyeingRecordId 
    }
  });

  if (!followUp) {
    return res.status(404).json({ message: 'Follow-up not found' });
  }

  // Check if user can delete (admin/manager or the person who created it)
  const canDelete = user.role === 'admin' || 
                   user.role === 'manager' || 
                   followUp.addedBy === user.id;

  if (!canDelete) {
    return res.status(403).json({ message: 'Not authorized to delete this follow-up' });
  }

  await followUp.destroy();

  res.status(200).json({ message: 'Follow-up deleted successfully' });
});

module.exports = {
  getFollowUpsByRecordId,
  createFollowUp,
  deleteFollowUp,
};
