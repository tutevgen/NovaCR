const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Product = require('../models/Product'); // предполагаемая модель
const checkRole = require('../middleware/checkRole');

router.get('/', checkRole('admin'), async (req, res) => {
  const categories = await Category.find().lean();

  const map = new Map();
  categories.forEach(cat => {
    if (!cat.parent) {
      map.set(cat._id.toString(), { ...cat, children: [] });
    }
  });

  categories.forEach(cat => {
    if (cat.parent) {
      const parentId = cat.parent.toString();
      if (map.has(parentId)) {
        map.get(parentId).children.push(cat);
      }
    }
  });

  const structured = Array.from(map.values());

  res.render('pages/admin/categories', {
    title: 'Категории',
    user: req.session.user,
    categories: structured,
    csrfToken: req.csrfToken()
  });
});

router.delete('/:id', checkRole('admin'), async (req, res) => {
  const { id } = req.params;

  // Проверка: есть ли подкатегории
  const hasChildren = await Category.exists({ parent: id });
  if (hasChildren) {
    return res.status(400).json({ error: 'Сначала удалите подкатегории' });
  }

  // Проверка: есть ли товары
  const hasProducts = await Product.exists({ category: id });
  if (hasProducts) {
    return res.status(400).json({ error: 'Нельзя удалить категорию: в ней есть товары' });
  }

  await Category.findByIdAndDelete(id);
  res.json({ success: true });
});

module.exports = router;