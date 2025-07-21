// controllers/qrcodeController.js
const { initiatePayment, verifyPayment } = require('../services/qrcodeService');

class QrCodeController {
  async initiatePaymentController(req, res) {
    try {
      const { merchantId, amount, currency } = req.body;

      if (!merchantId || !amount) {
        return res.status(400).json({ error: 'merchantId and amount are required' });
      }

      const result = await initiatePayment({ merchantId, amount, currency });

      return res.status(200).json({
        message: "Payment initiated successfully",
        data: result,
        error: null,
      });
    } catch (error) {
      console.error('Error in initiatePaymentController:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
      });

      return res.status(500).json({
        error: 'Failed to initiate payment',
        details: error.message.includes('ENOTFOUND')
          ? `Cannot connect to Bakong API: ${error.message}`
          : error.message,
      });
    }
  }

  async verifyPaymentController(req, res) {
    try {
      const { transactionId } = req.params;

      if (!transactionId) {
        return res.status(400).json({ error: 'transactionId is required' });
      }

      const transaction = await verifyPayment(transactionId);

      return res.status(200).json({
        message: "Payment verified successfully",
        data: transaction,
        error: null,
      });
    } catch (error) {
      console.error('Error in verifyPaymentController:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
      });

      return res.status(error.message === 'Transaction not found' ? 404 : 500).json({
        error: error.message === 'Transaction not found' ? 'Transaction not found' : 'Failed to verify payment',
        details: error.message.includes('ENOTFOUND')
          ? `Cannot connect to Bakong API: ${error.message}`
          : error.message,
      });
    }
  }
}

module.exports = new QrCodeController();