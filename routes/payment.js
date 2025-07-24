const express = require('express');
const QrCodeController = require('../controllers/qrcodeController');

const router = express.Router();

router.post('/purchase', (req, res) => QrCodeController.initiatePurchaseController(req, res));
router.post('/qr-code', (req, res) => QrCodeController.generateQrCodeController(req, res));
router.get('/verify/:transactionId', (req, res) => QrCodeController.verifyPaymentController(req, res));
router.get('/transactions', (req, res) => QrCodeController.getTransactionsController(req, res));
router.get('/transaction/:transactionId', (req, res) => QrCodeController.getTransactionController(req, res));
router.post('/webhook', (req, res) => QrCodeController.webhookController(req, res));


// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    message: 'PayWay service is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

module.exports = router;