QRCode Generate

Tech Stack:
- Node.js
- MongoDB
- Redis
- Axios
- qrcode
- Tailwind CSS (for frontend styling)

Features:
- Generate QR codes for payments with multi-currency support (KHR, USD)
- Verify payment status
- Store transactions in MongoDB
- Cache transactions in Redis for quick access
- Fallback mechanism if Bakong API is unreachable
- Responsive and user-friendly frontend

Setup Instructions:
1. Clone the repository.
2. Install dependencies: npm install
3. Set environment variables in .env file:
   - PORT=3000
   - MONGODB_URI=mongodb://localhost:27017/your_db_name
   - REDIS_URL=redis://localhost:6379
   - BAKONG_API_URL=https://api-sandbox.bakong.nbc.gov.kh/v1
   - BAKONG_API_KEY=your_api_key
   - BAKONG_MERCHANT_ID=your_merchant_id
4. Start MongoDB and Redis servers locally.
5. Run the server: npm start
6. Open the frontend in a browser (usually http://localhost:3000)

API Endpoints:
- POST /api/payment/initiate-payment
  Body: { merchantId, amount, currency }
  Response: transaction details including QR code URL.

- GET /api/payment/verify-payment/:transactionId
  Response: payment status and transaction info.

Notes:
- Ensure your API key and merchant ID are valid.
- The Bakong sandbox API may have limited availability; fallback logic is implemented.

---

Feel free to customize or ask if you want a README.md or more detailed docs!
