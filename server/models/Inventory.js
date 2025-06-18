const mongoose = require('mongoose');
// This model represents the inventory of products in the system.
const inventorySchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  location: { type: String }, // e.g., "Store A", "Warehouse 1"
}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema);
//coment: This model represents the inventory of products in the system. Each inventory item is linked to a product and has a quantity and location.