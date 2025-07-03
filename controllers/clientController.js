const Client = require('../models/Client');

// Показать список клиентов
exports.index = async (req, res, next) => {
  try {
    const clients = await Client.find();
    res.render('pages/admin/clients', { clients, title: 'Клиенты' });
  } catch (err) {
    next(err);
  }
};

// Обработать добавление нового клиента
exports.create = async (req, res, next) => {
  try {
    const { name, phone, email } = req.body;
    const client = new Client({ name, phone, email });
    await client.save();
    res.redirect('/admin/clients');
  } catch (err) {
    next(err);
  }
};

// Удалить клиента
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Client.findByIdAndDelete(id);
    res.redirect('/admin/clients');
  } catch (err) {
    next(err);
  }
};
