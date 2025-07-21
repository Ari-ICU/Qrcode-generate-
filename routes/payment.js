const express = require('express');
const {
  initiatePaymentController,
  verifyPaymentController,
} = require('../controllers/qrcodeController');

const router = express.Router();

router.post('/initiate-payment', initiatePaymentController);
router.get('/verify-payment/:transactionId', verifyPaymentController);

module.exports = router;
