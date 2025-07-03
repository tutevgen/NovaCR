const User = require('../models/User');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const axios = require('axios');
const crypto = require('crypto');

const SMS_API_KEY = process.env.SMS_API_KEY;
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.showRegister = (req, res) => {
  res.render('auth/register', {
    error: null,
    csrfToken: req.csrfToken()
  });
};

exports.register = async (req, res) => {
  const { name, login, password, confirmPassword } = req.body;
  const errors = [];

  if (!name || !name.trim()) errors.push('Укажите имя.');
  if (!login || !login.trim()) errors.push('Укажите телефон или email.');
  if (!password) errors.push('Введите пароль.');
  if (password && password.length < 6) errors.push('Пароль должен быть не короче 6 символов.');
  if (password !== confirmPassword) errors.push('Пароли не совпадают.');

  const isPhone = /^\\+?[0-9]{10,15}$/.test(login);
  const isEmail = /^\\S+@\\S+\\.\\S+$/.test(login);

  if (!isPhone && !isEmail) errors.push('Введите корректный номер телефона или email.');

  if (errors.length > 0) {
    return res.render('auth/register', {
      error: errors.join(' '),
      name,
      login,
      csrfToken: req.csrfToken()
    });
  }

  const existing = await User.findOne({ $or: [{ phone: login }, { email: login }] });
  if (existing) {
    return res.render('auth/register', {
      error: 'Пользователь с таким телефоном или email уже существует.',
      name,
      login,
      csrfToken: req.csrfToken()
    });
  }

  try {
    const code = generateCode();
    const hash = await bcrypt.hash(password, 8);

    const newUser = new User({
      name,
      email: isEmail ? login : null,
      phone: isPhone ? login : null,
      password: hash,
      verifyCode: code
    });

    await newUser.save();

    if (isEmail) {
      await transporter.sendMail({
        to: login,
        subject: 'Код подтверждения',
        text: `Ваш код подтверждения: ${code}`
      });
    }

    res.redirect('/verify');
  } catch (err) {
    if (err.code === 11000) {
      return res.render('auth/register', {
        error: 'Пользователь с таким логином уже зарегистрирован.',
        name,
        login,
        csrfToken: req.csrfToken()
      });
    }

    console.error('Ошибка при регистрации:', err);
    res.status(500).render('auth/register', {
      error: 'Ошибка сервера. Попробуйте позже.',
      name,
      login,
      csrfToken: req.csrfToken()
    });
  }
};