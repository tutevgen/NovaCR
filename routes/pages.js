// routes/pages.js

const express = require('express');
const router = express.Router();

const checkRole = require('../middleware/checkRole');

// Страницы + заголовки
const pages = {
  dashboard: "Главная",
  orders: "Заказы",
  calendar: "Календарь",
  store: "Продукция",
  docs: "Документация",
  tasks: "Задачи",
  clients: "Клиенты",
  proposals: "Коммерческие предложения",
  managers: "Менеджеры",
  technicians: "Монтажники",
  requests: "Заявки",
  trips: "Мои выезды",
  history: "История"
};

// Маппинг страниц по ролям
const rolePages = {
  client: ['dashboard', 'store', 'docs', 'history'],
  installer: ['dashboard', 'calendar', 'requests', 'trips'],
  manager: ['dashboard', 'calendar', 'clients', 'orders', 'products', 'proposals', 'requests', 'tasks'],
  admin: Object.keys(pages) // все страницы
};

// Генерация маршрутов
Object.entries(pages).forEach(([page, title]) => {
  const allowedRoles = Object.keys(rolePages).filter(role =>
    rolePages[role].includes(page)
  );

  if (allowedRoles.length === 0) return; // исключаем страницы без доступа

  router.get(`/${page}`, checkRole(...allowedRoles), (req, res) => {
    res.render(`pages/${page}`, {
      title,
      activePage: page,
      user: req.session.user
    });
  });
});

module.exports = router;