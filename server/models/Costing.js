const mongoose = require('mongoose');

const costingSchema = new mongoose.Schema({
  workOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkOrder',
    required: true
  },
  materialCost: {
    type: Number,
    required: true
  },
  laborCost: {
    type: Number,
    required: true
  },
  totalCost: {
    type: Number,
    required: true
  },
  calculatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Costing', costingSchema);
