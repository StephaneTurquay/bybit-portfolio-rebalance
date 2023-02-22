const { exchange } = require('./connectExchange.js');

async function getSpotMarketsUSDT() {
  await exchange.loadMarkets();
  const spotMarkets = Object.values(exchange.markets).filter(market => market.type === 'spot');
  const usdtMarkets = spotMarkets.filter(market => market.quote === 'USDT');
  const marketInfo = usdtMarkets.reduce((acc, market) => {
    const symbol = market.symbol.split('/')[0];
    acc[symbol] = {
      precision: {
        amount: market.precision.amount,
        price: market.precision.price
      },
      limits: {
        amount: {
          min: market.limits.amount.min,
          max: market.limits.amount.max
        },
        price: {
          min: market.limits.price.min,
          max: market.limits.price.max
        },
        cost: {
          min: market.limits.cost.min,
          max: market.limits.cost.max
        }
      },
      taker: market.taker,
      maker: market.maker
    };
    return acc;
  }, {});

  return marketInfo;
}

module.exports = { getSpotMarketsUSDT };
