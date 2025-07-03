// routes/panel.js

const express = require('express');
const router = express.Router();

const Product = require('../models/admin/Product');
const Category = require('../models/Category');
const ProductLog = require('../models/ProductLog');

const roleViews = {
  client: ["dashboard", "docs", "history", "store", "system"],
  installer: ["dashboard", "calendar", "requests", "trips", "settings"],
  manager: ["dashboard", "calendar", "clients", "orders", "products", "proposals", "requests", "tasks", "settings"],
  admin: ["dashboard", "calendar", "clients", "managers", "orders", "products", "proposals", "requests", "tasks", "technicians", "settings"]
};

router.get('/:role/:page', async (req, res) => {
  const { role, page } = req.params;
  const userRole = req.session.user?.role;

  // Проверяем, существует ли такая роль и страница
  if (!roleViews[role] || !roleViews[role].includes(page)) {
    return res.status(404).send('Страница не найдена');
  }

  // Проверяем, имеет ли пользователь право на просмотр этой роли
  if (userRole !== role && userRole !== 'admin') {
    return res.status(403).send('Доступ запрещён');
  }

  const viewData = {
    title: page.charAt(0).toUpperCase() + page.slice(1),
    activePage: page,
    user: req.session.user
  };

  // Если страница — продукты, подгружаем товары, категории и логи
  if (page === 'products') {
    viewData.products = await Product.find().populate('category').lean();
    viewData.categories = await Category.find().lean();
    viewData.logs = await ProductLog.find().populate('user').populate('product').sort({ timestamp: -1 }).limit(50).lean();
  }

  res.render(`pages/${role}/${page}`, viewData);
});

module.exports = router;
