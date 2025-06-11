const WorkOrder = require('../models/WorkOrder');

const workOrderController = {
  create: async (req, res) => {
    try {
      const workOrder = await WorkOrder.create(req.body);
      res.status(201).json(workOrder);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const workOrders = await WorkOrder.find()
        .populate('finishedProduct')
        .populate('createdBy');
      res.json(workOrders);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, actualCompletionTime } = req.body;

      const updated = await WorkOrder.findByIdAndUpdate(
        id,
        { status, actualCompletionTime },
        { new: true }
      );

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = workOrderController;
