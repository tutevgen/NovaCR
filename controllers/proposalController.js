// controllers/proposalController.js

const Proposal = require('../models/Proposal');
const User = require('../models/User');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const pdf = require('html-pdf');

/**
 * Форма создания КП
 */
exports.createProposalForm = async (req, res) => {
  try {
    const clients = await User.find({ role: 'client' });
    res.render('pages/admin/proposals-create', { title: 'Создать КП', clients });
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка при открытии формы');
  }
};

/**
 * Сохранение КП в БД
 */
exports.saveProposal = async (req, res) => {
  try {
    const { clientId, itemName, itemQty, itemPrice } = req.body;

    const client = await User.findById(clientId);
    if (!client) {
      req.flash('error', 'Клиент не найден');
      return res.redirect('/proposal/create');
    }

    const items = [];
    for (let i = 0; i < itemName.length; i++) {
      if (itemName[i] && itemQty[i] && itemPrice[i]) {
        items.push({
          name: itemName[i],
          quantity: parseInt(itemQty[i]),
          price: parseFloat(itemPrice[i]),
        });
      }
    }

    const totalPrice = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

    const proposal = new Proposal({
      clientId,
      clientName: client.name,
      items,
      totalPrice,
    });

    await proposal.save();
    res.redirect(`/proposal/${proposal._id}/view`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка при сохранении КП');
  }
};

/**
 * Просмотр КП в браузере
 */
exports.generatePDFView = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) {
      return res.status(404).send('Коммерческое предложение не найдено');
    }
    res.render('pages/admin/proposals-view', {
      title: `КП #${proposal._id}`,
      proposal
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка при загрузке КП');
  }
};

/**
 * Генерация и скачивание PDF
 */
exports.generatePDF = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) {
      return res.status(404).send('Коммерческое предложение не найдено');
    }

    const filePath = path.join(__dirname, '../views/pages/admin/proposals-pdf.ejs');
    const html = await ejs.renderFile(filePath, { proposal }, { async: true });

    const options = { format: 'A4' };

    pdf.create(html, options).toStream((err, stream) => {
      if (err) {
        console.error(err);
        return res.send('Ошибка при генерации PDF');
      }
      res.header('Content-Type', 'application/pdf');
      stream.pipe(res);
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка при генерации PDF');
  }
};