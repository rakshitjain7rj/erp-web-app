const mongoose = require('mongoose');

const workOrderSchema = new mongoose.Schema({
  finishedProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  status: { type: String, enum: ['planned', 'in_progress', 'completed'], default: 'planned' },
  estimatedCompletionTime: { type: Date, required: true },
  actualCompletionTime: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('WorkOrder', workOrderSchema);
