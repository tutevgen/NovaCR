// routes/proposalRoutes.js
const express = require('express');
const router = express.Router();
const checkRole = require('../middleware/checkRole');
const proposalController = require('../controllers/proposalController');

// Создание КП
router.get('/create', checkRole('admin'), proposalController.createProposalForm);
router.post('/save', checkRole('admin'), proposalController.saveProposal);

// Просмотр КП
router.get('/:id/view', checkRole('admin'), proposalController.generatePDFView); // ❗ Эта строка может вызывать ошибку

// Генерация PDF
router.get('/:id/pdf', checkRole('admin'), proposalController.generatePDF);

module.exports = router;