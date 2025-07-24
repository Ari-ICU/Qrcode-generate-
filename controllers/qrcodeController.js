// controllers/qrcodeController.js
const QrCodeService = require('../services/qrcodeService');
const Transaction = require('../models/Transaction');

class QrCodeController {
  async initiatePurchaseController(req, res) {
    try {
      const { amount, currency = 'KHR' } = req.body;
      if (!amount) return res.status(400).json({ message: 'Amount is required' });
      const result = await QrCodeService.initiatePurchase({ amount, currency });
      res.status(200).json({ message: 'Purchase initiated', data: result });
    } catch (err) {
      res.status(400).json({ message: 'Failed to initiate purchase', error: err.message });
    }
  }


  async generateQrCodeController(req, res) {
    try {
      const { amount, currency = 'KHR' } = req.body;
      if (!amount) return res.status(400).json({ message: 'Amount is required' });
      const result = await QrCodeService.generateQrCode({ amount, currency });
      res.status(200).json({ message: 'QR code generated', data: result });
    } catch (err) {
      res.status(400).json({ message: 'Failed to generate QR code', error: err.message });
    }
  }

  async verifyPaymentController(req, res) {
    try {
      const { transactionId } = req.params;
      if (!transactionId) return res.status(400).json({ message: 'Transaction ID is required' });
      const transaction = await QrCodeService.verifyPayment(transactionId);
      res.status(200).json({ message: 'Payment verified', data: transaction });
    } catch (err) {
      res.status(err.message === 'Transaction not found' ? 404 : 400).json({ message: err.message });
    }
  }

  async getTransactionsController(req, res) {
    try {
      const { limit = 10, page = 1, status } = req.query;
      const filter = status ? { status } : {};
      const transactions = await Transaction.find(filter).sort({ createdAt: -1 }).limit(parseInt(limit)).skip((parseInt(page) - 1) * parseInt(limit));
      const total = await Transaction.countDocuments(filter);
      res.status(200).json({ transactions, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
    } catch (err) {
      res.status(500).json({ message: 'Failed to retrieve transactions', error: err.message });
    }
  }

  async getTransactionController(req, res) {
    try {
      const { transactionId } = req.params;
      const transaction = await Transaction.findOne({ transactionId });
      if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
      res.status(200).json(transaction);
    } catch (err) {
      res.status(500).json({ message: 'Failed to retrieve transaction', error: err.message });
    }
  }

  async webhookController(req, res) {
    try {
      const { tran_id, status } = req.body;
      if (!tran_id) return res.status(400).json({ message: 'Transaction ID is required' });

      const transaction = await Transaction.findOne({ transactionId: tran_id });
      if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

      transaction.status = status || transaction.status;
      transaction.webhookData = req.body;
      await transaction.save();

      res.status(200).json({ message: 'Webhook processed', data: { transactionId: tran_id, status } });
    } catch (err) {
      res.status(500).json({ message: 'Failed to process webhook', error: err.message });
    }
  }
}

module.exports = new QrCodeController();
