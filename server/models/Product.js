const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['raw', 'finished'], required: true },
  unit: { type: String }, // kg, m, pcs, etc.
  cost: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
