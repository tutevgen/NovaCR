// models/ProductLog.js
const mongoose = require('mongoose');

const productLogSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, enum: ['create', 'update', 'delete'], required: true },
  timestamp: { type: Date, default: Date.now },
  changes: mongoose.Schema.Types.Mixed
});

module.exports = mongoose.model('ProductLog', productLogSchema);
