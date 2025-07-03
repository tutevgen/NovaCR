module.exports = (err, req, res, next) => {
  console.error('💥 Ошибка:', err.stack);
  res.status(500).render('pages/not-found', {
    title: 'Ошибка сервера',
    error: err.message || 'Внутренняя ошибка',
    activePage: ''
  });
};