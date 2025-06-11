const WorkOrder = require('../models/WorkOrder');

// 👉 Summary by Work Order status
const getProductionReport = async (req, res) => {
  try {
    const report = await WorkOrder.aggregate([
      {
        $group: {
          _id: "$status",
          total: { $sum: 1 }
        }
      }
    ]);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 👉 Find delayed Work Orders
const getDelayedOrders = async (req, res) => {
  try {
    const delayedOrders = await WorkOrder.find({
      estimatedCompletionTime: { $lt: new Date() },
      status: { $ne: 'completed' }
    });
    res.json(delayedOrders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getProductionReport,
  getDelayedOrders
};
