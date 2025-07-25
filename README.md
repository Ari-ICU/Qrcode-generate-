
QRCode Payment Service

A Node.js-based service for generating QR codes for payments (Bakong-compatible), verifying payment status, and managing transactions. Includes MongoDB for persistent storage, Redis for caching, and a Tailwind CSS-powered responsive frontend.

---

FEATURES
- Generate QR codes for payments with multi-currency support (KHR, USD).
- Verify payment status through API.
- Store transactions in MongoDB for persistence.
- Cache transactions in Redis for faster retrieval.
- Fallback mechanism if the Bakong API is unreachable.
- Responsive frontend styled with Tailwind CSS for a clean UI.

---

TECH STACK
- Backend: Node.js (Express)
- Database: MongoDB
- Cache: Redis
- API Requests: Axios
- QR Code Generator: qrcode
- Frontend: Tailwind CSS

---

SETUP INSTRUCTIONS

1. Clone the Repository
git clone https://github.com/yourusername/qrcode-payment-service.git
cd qrcode-payment-service

2. Install Dependencies
npm install

3. Configure Environment Variables
Create a .env file in the root directory:

PORT=3000
MONGODB_URI=mongodb://localhost:27017/your_db_name
REDIS_URL=redis://localhost:6379
BAKONG_API_URL=https://api-sandbox.bakong.nbc.gov.kh/v1
BAKONG_API_KEY=your_api_key
BAKONG_MERCHANT_ID=your_merchant_id

Note: Do NOT commit your .env file. Add it to .gitignore for security.

4. Start MongoDB & Redis
Make sure MongoDB and Redis servers are running locally:
mongod
redis-server

5. Run the Server
npm start

6. Open the Frontend
http://localhost:3000

---

API ENDPOINTS

1. Initiate Payment
POST /api/payment/initiate-payment
Body:
{
  "merchantId": "your_merchant_id",
  "amount": 10000,
  "currency": "KHR"
}

Response:
{
  "transactionId": "64adf23e4c1b0a001f2e1d2a",
  "qrCodeUrl": "https://example.com/qrcode.png",
  "status": "pending"
}

2. Verify Payment
GET /api/payment/verify-payment/:transactionId
Response:
{
  "transactionId": "64adf23e4c1b0a001f2e1d2a",
  "status": "success",
  "amount": 10000,
  "currency": "KHR"
}

3. Retrieve Transactions
GET /api/payment/transactions

4. Retrieve Single Transaction
GET /api/payment/transaction/:transactionId

5. Webhook for Payment Updates
POST /api/payment/webhook

6. Health Check
GET /api/payment/health
Response:
{
  "message": "PayWay service is running",
  "timestamp": "2025-07-25T05:20:00.000Z",
  "env": "development"
}

---

NOTES
- Ensure your Bakong API Key and Merchant ID are valid.
- Sandbox API may have limited availability; fallback logic is implemented.
- Do NOT commit your .env file to GitHub.

---

SECURITY
- .env is ignored in .gitignore to prevent leaks.
- Use GitHub Secrets for production deployments (e.g., Actions or CI/CD).

---

LICENSE
MIT License – Feel free to use and customize.

---

CONTRIBUTING
Pull requests are welcome. For major changes, open an issue first to discuss.

---

AUTHOR
Built by Thoeurn Ratha.
