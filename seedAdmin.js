// seedAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

async function createAdmin() {
  await mongoose.connect(process.env.MONGO_URI);

  const existing = await User.findOne({ login: 'info@nova-filter.ru' });
  if (existing) {
    console.log('Администратор уже существует');
    return process.exit();
  }

  const hash = await bcrypt.hash('admin1234', 10);

  const admin = new User({
    name: 'Администратор',
    login: 'info@nova-filter.ru',
    email: 'info@nova-filter.ru',
    isPhone: false,
    password: hash,
    role: 'admin',
    isVerified: true
  });

  await admin.save();
  console.log('✅ Администратор создан');
  process.exit();
}

createAdmin();
