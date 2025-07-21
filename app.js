const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const chalk = require('chalk').default; // Use default export for Chalk v5
const os = require('os');
const paymentRoutes = require('./routes/payment');

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static('public')); // Serve static files (e.g., index.html)

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bakong_payment', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log(chalk.green('Connected to MongoDB')))
  .catch((err) => console.error(chalk.red('MongoDB connection error:', err)));

// Routes
app.use('/api/payment', paymentRoutes);

// Get network interfaces for external access
const getNetworkAddress = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

// Start server with improved URL output
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Bind to all interfaces
const ENVIRONMENT = process.env.NODE_ENV || 'development';
const BASE_URL = ENVIRONMENT === 'production' ? process.env.APP_URL || 'your-production-domain.com' : 'localhost';

app.listen(PORT, HOST, () => {
  const localUrl = `http://localhost:${PORT}`;
  const networkUrl = `http://${getNetworkAddress()}:${PORT}`;
  console.log(chalk.cyan(`Server running on port ${PORT}`));
  console.log(chalk.cyan(`Environment: ${ENVIRONMENT}`));
  console.log(chalk.yellow(`Local URL: ${localUrl}`));
  if (ENVIRONMENT !== 'production') {
    console.log(chalk.yellow(`Network URL: ${networkUrl}`));
  }
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(chalk.red(`Port ${PORT} is already in use. Please choose a different port.`));
  } else {
    console.error(chalk.red('Server error:', err.message));
  }
  process.exit(1);
});