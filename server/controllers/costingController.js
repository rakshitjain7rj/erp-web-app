const Costing = require('../models/Costing');
const WorkOrder = require('../models/WorkOrder');

// 👉 Create new costing record
const calculateCost = async (req, res) => {
  try {
    const { workOrderId, materialCost, laborCost } = req.body;

    const totalCost = materialCost + laborCost;

    const costing = new Costing({
      workOrder: workOrderId,
      materialCost,
      laborCost,
      totalCost
    });

    await costing.save();
    res.status(201).json(costing);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 👉 Get costing for a specific Work Order
const getCostByWorkOrder = async (req, res) => {
  try {
    const costing = await Costing.findOne({ workOrder: req.params.id }).populate('workOrder');
    if (!costing) return res.status(404).json({ error: "Cost not found" });
    res.json(costing);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Named exports for consistency
module.exports = {
  calculateCost,
  getCostByWorkOrder
};
