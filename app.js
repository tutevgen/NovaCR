require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const { doubleCsrf } = require('csrf-csrf');
const { v4: uuidv4 } = require('uuid');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Отключаем устаревшие предупреждения
process.removeAllListeners('warning');

// Подключение к MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("✅ Успешное подключение к MongoDB");
  } catch (err) {
    console.error("❌ Ошибка подключения к MongoDB:", err.message);
    process.exit(1);
  }
};

connectDB();

// Настройка шаблонизатора
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(express.json())
app.use(cookieParser());
app.use(helmet());

// Лимитер запросов
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// CSRF защита
const { generateToken } = doubleCsrf({
  getSecret: () => process.env.SESSION_SECRET || uuidv4(),
  cookieName: 'csrfToken',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false // Отключаем secure для HTTP
  }
});

// Сессии (HTTP-режим)
app.use(session({
  secret: process.env.SESSION_SECRET || uuidv4(),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Важно для HTTP!
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

app.use(flash());

// Генерация CSRF токена
app.use((req, res, next) => {
  res.locals.csrfToken = generateToken(res);
  next();
});

// Модели
const User = require('./models/User');
app.use((req, res, next) => {
  req.db = { User };
  next();
});

// Локали для шаблонов
app.use((req, res, next) => {
  res.locals.user = req.session?.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.url = req.originalUrl;
  next();
});

// Роуты
app.use('/admin/products', require('./routes/admin/products'));
app.use('/client/settings', require('./routes/client/settings'));
app.use(require('./routes/auth'));
app.use(require('./routes/panel'));
app.use(require('./routes/pages'));

// Главная страница
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err.code === 'EBADCSRFTOKEN') {
    req.flash('error', 'Недействительный CSRF-токен');
    return res.redirect('back');
  }
  
  req.flash('error', 'Произошла внутренняя ошибка сервера');
  res.redirect('/');
});

// 404
app.use((req, res) => {
  res.status(404).render('pages/errors/404', {
    title: 'Страница не найдена'
  });
});

// Запуск HTTP-сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
});