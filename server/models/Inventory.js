// server/models/Inventory.js
const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
{
// Basic Product Information
productName: { type: String, required: true },
category: { type: String },
rawMaterial: { type: String, required: true }, // yarn type used

// Quantity & Production
effectiveYarn: { type: Number, required: true }, // in meters per unit
count: { type: Number, required: true }, // grams per meter
unitsProduced: { type: Number, default: 0 }, // how many units produced
initialQuantity: { type: Number, required: true }, // initial yarn in kg
currentQuantity: { type: Number }, // current quantity in kg
gsm: { type: Number }, // grams per square meter

// Costing
costPerKg: { type: Number }, // cost per kilogram
totalValue: { type: Number }, // total value of inventory

// Location & Storage
location: { type: String }, // legacy location field
warehouseLocation: { type: String }, // specific warehouse location
batchNumber: { type: String }, // batch tracking number
supplierName: { type: String }, // supplier information

// Manual Override Flags
manualQuantity: { type: Boolean, default: false }, // manual quantity override
manualValue: { type: Boolean, default: false }, // manual value override
manualYarn: { type: Boolean, default: false }, // manual yarn override

// Additional Information
remarks: { type: String }, // notes and remarks about the inventory item
status: { type: String, enum: ["Available", "Reserved", "Out of Stock"], default: "Available" },
},
{
timestamps: true, // adds createdAt and updatedAt
}
);

module.exports = mongoose.model("Inventory", inventorySchema);

