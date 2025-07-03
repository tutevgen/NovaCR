// routes/main.js

const express = require('express');
const router = express.Router();
const mainController = require('../controllers/mainController');

// Главная страница
router.get('/', mainController.index);

// Страница 403 — доступ запрещён
router.get('/forbidden', (req, res) => {
  res.status(403).render('pages/forbidden', {
    title: 'Доступ запрещён',
    activePage: 'forbidden'
  });
});

// Страница 404 — не найдено
router.get('/not-found', (req, res) => {
  res.status(404).render('pages/not-found', {
    title: 'Страница не найдена',
    activePage: 'not-found'
  });
});

module.exports = router;