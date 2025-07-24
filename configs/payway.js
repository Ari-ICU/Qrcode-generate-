// configs/payway.js
module.exports = {
  merchantId: process.env.ABA_MERCHANT_ID,
  publicKeyId: process.env.ABA_PUBLIC_KEY,
  apiUrl: process.env.ABA_API_URL,
  validate: function () {
    if (!this.merchantId || !this.publicKeyId || !this.apiUrl) {
      throw new Error('Missing ABA PayWay configuration');
    }
  }
};