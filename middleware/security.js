const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Слишком много запросов, попробуйте позже.'
});

module.exports = {
  applySecurity(app) {
    app.use(helmet());
    app.use(limiter);
  }
};
