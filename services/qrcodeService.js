// services/qrcodeService.js
const axios = require('axios');
const fs = require('fs');
const crypto = require('crypto');
const redisClient = require('../configs/redis');
const Transaction = require('../models/Transaction');

const RSA_PRIVATE_KEY = fs.readFileSync('rsa_private_pkcs8.key', 'utf8');

class QrCodeService {
  /**
   * Generate RSA signature with all required fields
   */
  static generateRsaSignature(
    tran_id,
    req_time,
    merchant_id,
    formattedAmount,
    currency,
    paymentOption,
    description,
    publicKeyId,
  ) {
    try {
      const desc = description || '';
      const pubKey = publicKeyId || '';
      const payOpt = paymentOption || '';

      const payload = `${tran_id}|${req_time}|${merchant_id}|${formattedAmount}|${currency}|${payOpt}|${desc}|${pubKey}`;

      console.log('Signature Input:', {
        tran_id,
        req_time,
        merchant_id,
        formattedAmount,
        currency,
        paymentOption: payOpt,
        description: desc,
        publicKeyId: pubKey,
        payload
      });

      const sign = crypto.createSign('RSA-SHA256');
      sign.update(payload, 'utf8');
      return sign.sign(RSA_PRIVATE_KEY, 'base64');
    } catch (error) {
      throw new Error('Failed to generate RSA signature: ' + error.message);
    }
  }

  /**
   * Initiate a purchase
   */
  static async initiatePurchase({ amount, currency = 'KHR' }) {
    const merchantId = process.env.ABA_MERCHANT_ID;
    const publicKeyId = process.env.ABA_PUBLIC_KEY;
    const apiUrl = process.env.ABA_API_URL;

    console.log('Config:', { merchantId, publicKeyId, apiUrl });
    if (!merchantId || !publicKeyId || !apiUrl)
      throw new Error('Missing ABA PayWay config');

    const transactionId = `${Date.now()}`;
    const reqTime = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const amountForApiAndSignature =
      currency === 'KHR'
        ? Math.floor(parseFloat(amount)).toString()
        : parseFloat(amount).toFixed(2);

    const paymentOption = 'abapay';
    const description = 'Payment via ABA PayWay';

    const hash = this.generateRsaSignature(
      transactionId,
      reqTime,
      merchantId,
      amountForApiAndSignature,
      currency,
      paymentOption,
      description,
      publicKeyId
    );

    const payload = {
      tran_id: transactionId,
      req_time: reqTime,
      merchant_id: merchantId,
      amount: amountForApiAndSignature,
      currency,
      payment_option: paymentOption,
      description,
      public_key: publicKeyId,
      hash,
    };

    console.log('Request Payload:', JSON.stringify(payload, null, 2));

    try {
      const response = await axios.post(apiUrl, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      });
      console.log('ABA PayWay API Response:', JSON.stringify(response.data, null, 2));

      if (response.data.status && response.data.status.code !== 0) {
        throw new Error(response.data.status.message || 'PayWay API error');
      }
      if (response.data.error_code || response.data.status === 'error') {
        throw new Error(
          response.data.description || response.data.message || 'PayWay API error'
        );
      }

      const qrCodeUrl = response.data.checkout_url;
      if (!qrCodeUrl) throw new Error('No checkout URL returned');

      const transaction = await this.saveTransaction({
        transactionId,
        merchantId,
        amount: amountForApiAndSignature,
        currency,
        qrCodeUrl,
        reference: transactionId,
        status: 'pending',
      });

      return transaction;
    } catch (error) {
      console.error('PayWay API error:', error.response?.data || error.message);
      throw new Error(error.message || 'Failed to initiate purchase');
    }
  }

  /**
   * Save transaction to DB and cache
   */
  static async saveTransaction(data) {
    try {
      const transaction = new Transaction(data);
      await transaction.save();
      console.log('Transaction saved:', transaction.transactionId);

      try {
        await redisClient.setEx(
          `transaction:${transaction.transactionId}`,
          300,
          JSON.stringify(transaction)
        );
      } catch (err) {
        console.error('Redis cache error:', err.message);
      }
      return transaction;
    } catch (err) {
      console.error('DB save error:', err.message);
      throw new Error('Failed to save transaction: ' + err.message);
    }
  }

  /**
   * Generate QR Code request
   */
  static async generateQrCode({ amount, currency = 'KHR' }) {
    const qrApiUrl =
      process.env.ABA_QR_API_URL ||
      (process.env.ABA_API_URL?.replace('purchase', 'qr-code'));
    const merchantId = process.env.ABA_MERCHANT_ID;
    const publicKeyId = process.env.ABA_PUBLIC_KEY;

    if (!merchantId || !publicKeyId || !qrApiUrl)
      throw new Error('Missing QR API config');

    const transactionId = `${Date.now()}`;
    const reqTime = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const amountForApiAndSignature =
      currency === 'KHR'
        ? Math.floor(parseFloat(amount)).toString()
        : parseFloat(amount).toFixed(2);

    const paymentOption = 'abapay_request_qr';
    const description = 'QR Payment via ABA PayWay';

    const hash = this.generateRsaSignature(
      transactionId,
      reqTime,
      merchantId,
      amountForApiAndSignature,
      currency,
      paymentOption,
      description,
      publicKeyId
    );

    const payload = {
      tran_id: transactionId,
      req_time: reqTime,
      merchant_id: merchantId,
      amount: amountForApiAndSignature,
      currency,
      payment_option: paymentOption,
      description,
      public_key: publicKeyId,
      hash,
    };

    try {
      const response = await axios.post(qrApiUrl, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      });

      const qrCodeUrl = response.data.qr_code_url || response.data.checkout_url;
      if (!qrCodeUrl) throw new Error('No QR code URL returned');

      const transaction = await this.saveTransaction({
        transactionId,
        merchantId,
        amount: amountForApiAndSignature,
        currency,
        qrCodeUrl,
        qrCodeData: response.data.qr_code || response.data.qr_data,
        reference: transactionId,
        status: 'pending',
      });

      return { transactionId, qrCodeUrl, merchantId, amount: amountForApiAndSignature, currency };
    } catch (error) {
      console.error('QR API error:', error.response?.data || error.message);
      // fallback to initiatePurchase
      return this.initiatePurchase({ amount, currency });
    }
  }

  /**
   * Verify payment status from PayWay
   */
  static async verifyPayment(transactionId) {
    if (!transactionId) throw new Error('Transaction ID is required');

    // Try cache first
    try {
      const cached = await redisClient.get(`transaction:${transactionId}`);
      if (cached) return JSON.parse(cached);
    } catch (err) {
      console.error('Redis error:', err.message);
    }

    const transaction = await Transaction.findOne({ transactionId });
    if (!transaction) throw new Error('Transaction not found');

    try {
      const reqTime = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
      const merchantId = process.env.ABA_MERCHANT_ID;
      const publicKeyId = process.env.ABA_PUBLIC_KEY;

      const amountForSignature =
        transaction.currency === 'KHR'
          ? Math.floor(parseFloat(transaction.amount)).toString()
          : parseFloat(transaction.amount).toFixed(2);

      // For verification, payment_option and description may be empty strings if not specified by docs
      const paymentOption = ''; 
      const description = '';

      const hash = this.generateRsaSignature(
        transactionId,
        reqTime,
        merchantId,
        amountForSignature,
        transaction.currency,
        paymentOption,
        description,
        publicKeyId
      );

      const verifyUrl =
        process.env.ABA_VERIFY_URL ||
        'https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/check-transaction';

      const response = await axios.post(
        verifyUrl,
        {
          tran_id: transactionId,
          req_time: reqTime,
          merchant_id: merchantId,
          public_key: publicKeyId,
          hash,
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
      );

      if (response.data.status) {
        transaction.status = response.data.status;
        transaction.paymentDetails = response.data;
        await transaction.save();
        await redisClient.setEx(
          `transaction:${transactionId}`,
          300,
          JSON.stringify(transaction)
        );
      }

      return transaction;
    } catch (error) {
      console.error('PayWay verification error:', error.response?.data || error.message);
      return transaction; // return last known state
    }
  }
}

module.exports = QrCodeService;
