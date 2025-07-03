// middleware/checkRole.js

module.exports = (...allowedRoles) => {
  return (req, res, next) => {
    const user = req.session?.user;

    // Проверка авторизации
    if (!user) {
      return res.redirect('/forbidden');
    }

    // Проверка роли
    if (!allowedRoles.includes(user.role)) {
      return res.redirect('/forbidden');
    }

    next();
  };
};