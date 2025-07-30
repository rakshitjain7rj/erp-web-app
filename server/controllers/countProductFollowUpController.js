// server/controllers/countProductFollowUpController.js
const asyncHandler = require('express-async-handler');
const CountProductFollowUp = require('../models/CountProductFollowUp');

// GET follow-ups by countProductId
const getFollowUpsByCountProductId = asyncHandler(async (req, res) => {
  const { countProductId } = req.params;

  const followUps = await CountProductFollowUp.findAll({
    where: { countProductId },
    order: [['followUpDate', 'DESC']],
  });

  res.status(200).json(followUps);
});

// POST a follow-up to a count product
const createCountProductFollowUp = asyncHandler(async (req, res) => {
  const { countProductId } = req.params;
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
    countProductId: parseInt(countProductId),
    followUpDate,
    remarks: remarks.trim(),
    addedBy: user.id,
    addedByName: user.name,
  };

  console.log('Creating count product follow-up with data:', followUpData);

  const followUp = await CountProductFollowUp.create(followUpData);

  res.status(201).json(followUp);
});

// DELETE a follow-up
const deleteCountProductFollowUp = asyncHandler(async (req, res) => {
  const { countProductId, followUpId } = req.params;
  const user = req.user;

  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Find the follow-up
  const followUp = await CountProductFollowUp.findOne({
    where: { 
      id: followUpId, 
      countProductId 
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
  getFollowUpsByCountProductId,
  createCountProductFollowUp,
  deleteCountProductFollowUp,
};
