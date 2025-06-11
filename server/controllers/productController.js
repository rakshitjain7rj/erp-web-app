const Product = require('../models/Product');

const productController = {
  create: async (req, res) => {
    try {
      const product = await Product.create(req.body);
      res.status(201).json(product);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  getAll: async (req, res) => {
    const products = await Product.find();
    res.json(products);
  }
};

module.exports = productController;
