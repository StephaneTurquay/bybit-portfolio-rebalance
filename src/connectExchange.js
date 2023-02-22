require('dotenv').config();
const ccxt = require('ccxt');
const exchangeId = 'bybit'; // replace with your exchange ID
const exchange = new ccxt[exchangeId]({
  apiKey: process.env.API_KEY,
  secret: process.env.API_SECRET,
  enableRateLimit: true,
  options: {'defaultType': 'spot' }
});
exchange.setSandboxMode(true);

module.exports = { exchange };