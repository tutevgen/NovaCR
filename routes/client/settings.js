const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const checkRole = require('../../middleware/checkRole');

// Настройка загрузки аватара
const uploadDir = path.join(process.cwd(), 'public/img/avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({ storage });

// Обёртка, чтобы multer не падал, если файла нет
const safeSingleUpload = (fieldName) => (req, res, next) => {
  const handler = upload.single(fieldName);
  handler(req, res, function (err) {
    if (err && err.code === 'Unexpected end of form') {
      console.warn('⛔️ Multer: avatar not included — skipping');
      return next();
    }
    return err ? next(err) : next();
  });
};

// GET /client/settings
router.get('/', checkRole('client'), async (req, res) => {
  try {
    console.log('🔍 req.file:', req.file);
    const user = await req.db.User.findById(req.session.user._id);
    res.render('pages/client/settings', {
      user,
      title: 'Настройки',
      csrfToken: res.locals.csrfToken,
      
    });
  } catch (err) {
    console.error('Ошибка загрузки настроек:', err);
    req.flash('error', 'Не удалось загрузить настройки');
    res.redirect('/');
  }
});

// POST /client/settings/profile
router.post('/profile', checkRole('client'),upload.single('avatar'), [
  body('name').trim().notEmpty().withMessage('ФИО обязательно'),
  body('email').isEmail().normalizeEmail().withMessage('Некорректный email')
], async (req, res) => {
  try {
    console.log('🔍 req.file:', req.file);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array()[0].msg);
      return res.redirect('/client/settings');
    }

    const { name, email, phone } = req.body;
    const userId = req.session.user._id;

    await req.db.User.findByIdAndUpdate(userId, {
      ...(req.file && { avatar: req.file.filename }),
      name,
      email,
      phone,
      'orgDetails.companyName': req.body.org?.companyName,
      'orgDetails.inn': req.body.org?.inn,
      'orgDetails.kpp': req.body.org?.kpp,
      'orgDetails.legalAddress': req.body.org?.legalAddress,
      'orgDetails.bankName': req.body.org?.bankName,
      'orgDetails.bik': req.body.org?.bik,
      'orgDetails.rs': req.body.org?.rs,
      'orgDetails.ks': req.body.org?.ks
    });

    req.session.user = await req.db.User.findById(userId);

    req.session.user = await req.db.User.findById(userId);

    req.flash('success', 'Профиль успешно обновлён');
    res.redirect('/client/settings');
  } catch (err) {
    console.error('Ошибка обновления профиля:', err);
    req.flash('error', 'Ошибка при сохранении данных');
    res.redirect('/client/settings');
  }
});

module.exports = router;