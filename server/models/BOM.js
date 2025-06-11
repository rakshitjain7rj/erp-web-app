const mongoose = require('mongoose');

const bomSchema = new mongoose.Schema({
  finishedProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  components: [{
    component: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number
  }]
}, { timestamps: true });

module.exports = mongoose.model('BOM', bomSchema);
