const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  location: { type: String }, // e.g., "Store A", "Warehouse 1"
}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema);
