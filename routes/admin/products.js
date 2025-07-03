const express = require('express');
const router = express.Router();
const controller = require('../../controllers/admin/productsController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Настройка загрузки изображений
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../public/uploads/products');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e5)}${ext}`);
  }
});
const upload = multer({ storage });

// Подключение middleware
const checkRole = require('../../middleware/checkRole');

// === Роуты ===

router.get('/', checkRole('admin', 'manager'), controller.listProducts);

// Категории
router.get('/categories', checkRole('admin', 'manager'), controller.getCategories);
router.post('/categories', checkRole('admin', 'manager'), controller.createCategory);
router.put('/categories/:id', checkRole('admin', 'manager'), controller.updateCategory);
router.delete('/categories/:id', checkRole('admin'), controller.deleteCategory);

// Товары
router.post('/', checkRole('admin', 'manager'), upload.single('photo'), controller.createProduct);
router.put('/:id', checkRole('admin', 'manager'), upload.single('photo'), controller.updateProduct);
router.delete('/:id', checkRole('admin'), controller.deleteProduct);

router.post('/:id/toggle-visibility', checkRole('admin', 'manager'), controller.toggleVisibility);
router.get('/char-values', checkRole('admin', 'manager'), controller.getCharValues);


module.exports = router;