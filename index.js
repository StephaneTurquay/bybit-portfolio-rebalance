// Generate by ChatGPT

const ccxt = require('ccxt');
const { apiKey, secret } = require('./config');
const exchangeId = 'bybit'; // replace with your exchange ID
const exchange = new ccxt[exchangeId]({
  apiKey,
  secret,
  enableRateLimit: true
});

async function getAccountBalance() {
  await exchange.loadMarkets();
  const balance = await exchange.fetchBalance();
  return balance.total;
}

async function getTotalCoinAmount(symbol) {
  const balance = await exchange.fetchBalance();

  if (!balance.hasOwnProperty(symbol)) {
    throw new Error(`Symbol ${symbol} not found in account balance`);
  }

  const amount = balance[symbol].total;

  return amount;
}

// Example usage:
getAccountBalance()
  .then((balance) => console.log('Account Balance:', balance))
  .catch((error) => console.error(error));

getTotalCoinAmount('BTC')
  .then((amount) => console.log('Total BTC Held:', amount))
  .catch((error) => console.error(error));
