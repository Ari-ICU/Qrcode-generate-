


// services/qrcodeService.js
const axios = require('axios');
const QRCode = require('qrcode');
const mongoose = require('mongoose');
const redisClient = require('../configs/redis');
const Transaction = require('../models/Transaction');

class QrCodeService {
  // Generate KHQR string (calls Bakong API or fallback)
  static async generateKHQRString(merchantId, amount, currency, transactionId) {
    try {
      const response = await axios.post(
        `${process.env.BAKONG_API_URL}/generate-khqr`,
        { merchantId, amount, currency, transactionId },
        {
          headers: {
            Authorization: `Bearer ${process.env.BAKONG_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data.khqrString;
    } catch (error) {
      console.error('Bakong API fallback used:', error.message);
      // Fallback to mock KHQR string (replace with real spec if available)
      return `0002010102125204${merchantId}5303${currency}540${amount}5802KH591${merchantId}62${transactionId}`;
    }
  }

  // Initiate payment and generate QR code
  static async initiatePayment({ merchantId, amount, currency = 'KHR' }) {
    const transactionId = new mongoose.Types.ObjectId().toString();
    const khqrString = await QrCodeService.generateKHQRString(merchantId, amount, currency, transactionId);
    const qrCodeUrl = await QRCode.toDataURL(khqrString);

    const transaction = new Transaction({
      transactionId,
      merchantId,
      amount,
      currency,
      qrCodeUrl,
      reference: transactionId,
      status: 'pending',
    });

    await transaction.save();

    // Cache transaction in Redis for 5 minutes (300 seconds)
    await redisClient.setEx(`transaction:${transactionId}`, 300, JSON.stringify(transaction));

    return { transactionId, qrCodeUrl, merchantId, amount, currency };
  }

  // Verify payment status (cache-first, fallback to DB)
  static async verifyPayment(transactionId) {
    // Try to get from Redis cache
    const cached = await redisClient.get(`transaction:${transactionId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // If not cached, check MongoDB
    const transaction = await Transaction.findOne({ transactionId });
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Optional: Verify with Bakong API (uncomment if implemented)
    /*
    const response = await axios.get(
      `${process.env.BAKONG_API_URL}/verify/${transactionId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.BAKONG_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    transaction.status = response.data.status;
    await transaction.save();
    */

    // Update Redis cache with latest transaction data
    await redisClient.setEx(`transaction:${transactionId}`, 300, JSON.stringify(transaction));

    return transaction;
  }
}

module.exports = QrCodeService;