// routes/products.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/productsController');
const checkRole = require('../middleware/checkRole');

// Категории
router.get('/categories', checkRole('admin', 'manager'), controller.getCategories);
router.post('/categories', checkRole('admin', 'manager'), controller.createCategory);
router.delete('/categories/:id', checkRole('admin'), controller.deleteCategory);

// Товары
router.get('/', checkRole('admin', 'manager'), controller.listProducts);
router.post('/', checkRole('admin', 'manager'), controller.createProduct);
router.put('/:id', checkRole('admin', 'manager'), controller.updateProduct);
router.delete('/:id', checkRole('admin', 'manager'), controller.deleteProduct);

module.exports = router;