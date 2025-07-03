const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');

// Настройка SMTP транспорта
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// GET /login
router.get('/login', (req, res) => {
  res.render('auth/login', {
    error: req.flash('error')[0] || null,
    csrfToken: res.locals.csrfToken || ''
  });
});

// POST /login
router.post('/login', 
  [
    body('login').trim().notEmpty().withMessage('Логин обязателен'),
    body('password').notEmpty().withMessage('Пароль обязателен')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        req.flash('error', errors.array()[0].msg);
        return res.redirect('/login');
      }

      const { login, password } = req.body;
      const user = await req.db.User.findOne({ login });

      if (!user || !bcrypt.compareSync(password, user.password)) {
        req.flash('error', 'Неверный логин или пароль');
        return res.redirect('/login');
      }

      if (!user.isVerified) {
        // Отправка email с подтверждением
        const mailOptions = {
          from: process.env.SMTP_FROM,
          to: user.email,
          subject: 'Подтверждение аккаунта',
          html: `<p>Пожалуйста, подтвердите ваш аккаунт, перейдя по <a href="http://${req.headers.host}/verify/${user.verificationToken}">ссылке</a></p>`
        };

        await transporter.sendMail(mailOptions);
        req.flash('error', 'Аккаунт не подтверждён. Проверьте вашу почту.');
        return res.redirect('/login');
      }

      req.session.user = {
        _id: user._id,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        email: user.email
      };

      await new Promise((resolve, reject) => {
        req.session.save(err => err ? reject(err) : resolve());
      });

      const redirects = {
        client: '/client/dashboard',
        manager: '/manager/dashboard',
        installer: '/installer/settings',
        admin: '/admin/settings'
      };

      res.redirect(redirects[user.role] || '/');
    } catch (err) {
      next(err);
    }
  }
);


// GET /register
router.get('/register', (req, res) => {
  res.render('auth/register', {
    error: req.flash('error')[0] || null,
    csrfToken: res.locals.csrfToken || ''
  });
});

// POST /register
router.post('/register',
  [
    body('name').trim().notEmpty().withMessage('Имя обязательно'),
    body('login').notEmpty().withMessage('Логин обязателен'),
    body('password').isLength({ min: 6 }).withMessage('Пароль от 6 символов')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array()[0].msg);
      return res.redirect('/register');
    }

    const { name, login, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);

    await req.db.User.create({
      name,
      login,
      password: hashed,
      role: 'client',
      isPhone: /^\+?[0-9]{10,15}$/.test(login),
      isVerified: true
    });

    req.flash('success', 'Регистрация прошла успешно. Войдите в систему.');
    res.redirect('/login');
  }
);

// GET /logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});

module.exports = router;