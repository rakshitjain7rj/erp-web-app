// server/models/BOM.js
const mongoose = require("mongoose");

const bomSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  components: [
    {
      componentName: String,
      quantity: Number,
      unit: String
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("BOM", bomSchema);
