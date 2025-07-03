const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category',
    required: true
  },
  photo: String,
  quantity: {
    type: Number,
    default: 0,
    min: 0
  },
  wholesalePrice: {
    type: Number,
    min: 0
  },
  warehouse: String,
  characteristics: { 
    type: Map, 
    of: String 
  },
  isVisible: { 
    type: Boolean, 
    default: true 
  },

  createdAt: { 
    type: Date, 
    default: Date.now,
    immutable: true
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);