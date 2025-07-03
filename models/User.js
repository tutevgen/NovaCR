const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Имя обязательно'],
    trim: true
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return !v || /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: props => `${props.value} — некорректный email`
    }
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  login: {
    type: String,
    required: true,
    unique: true
  },
  isPhone: {
    type: Boolean,
    required: true
  },
  password: {
    type: String,
    required: [true, 'Пароль обязателен'],
    minlength: [6, 'Пароль должен быть не короче 6 символов']
  },
  role: {
    type: String,
    enum: ['client', 'installer', 'manager', 'admin'],
    default: 'client'
  },
  avatar: String,
  address: String,
  orgDetails: {
    type: {
      companyName: String,
      inn: String,
      kpp: String,
      legalAddress: String,
      bankName: String,
      bik: String,
      rs: String,
      ks: String
    },
    _id: false
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: String,
  verificationExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Индексы
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);