const BOM = require('../models/BOM');

const bomController = {
  create: async (req, res) => {
    try {
      const bom = await BOM.create(req.body);
      res.status(201).json(bom);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const boms = await BOM.find()
        .populate('finishedProduct')
        .populate('components.component');
      res.json(boms);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = bomController;
