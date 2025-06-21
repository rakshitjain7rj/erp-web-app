// controllers/dyeingSummaryController.js
const asyncHandler = require('express-async-handler');
const DyeingRecord = require('../models/DyeingRecord');

// GET /api/dyeing/summary
const getDyeingSummary = asyncHandler(async (req, res) => {
  try {
    // Fetch all dyeing records ordered by creation date
    const allRecords = await DyeingRecord.findAll({
      order: [['createdAt', 'DESC']],
    });

    // Format records as expected by the frontend
    const formattedRecords = allRecords.map((record) => ({
      id: record.id,
      yarnType: record.yarnType || "Unknown",
      sentDate: record.sentDate || null,
      expectedArrivalDate: record.expectedArrivalDate || null,
      arrivalDate: record.arrivalDate || null,
    }));

    res.status(200).json(formattedRecords); // ✅ frontend expects array of objects like this
  } catch (error) {
    console.error("❌ Error in getDyeingSummary:", error);
    res.status(500).json({ message: "Failed to fetch dyeing summary." });
  }
});

module.exports = { getDyeingSummary };
