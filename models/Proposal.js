// models/Proposal.js
const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: String,
  quantity: Number,
  price: Number,
});

const proposalSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  clientName: String,
  items: [itemSchema],
  totalPrice: Number,
  createdAt: { type: Date, default: Date.now },
  status: { type: String, default: 'draft' }, // draft, sent, accepted
});

module.exports = mongoose.model('Proposal', proposalSchema);