const Inventory = require('../models/Inventory');

const inventoryController = {
  create: async (req, res) => {
    try {
      const inventory = await Inventory.create(req.body);
      res.status(201).json(inventory);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const inventory = await Inventory.find().populate('product');
      res.json(inventory);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = inventoryController;
