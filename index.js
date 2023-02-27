const { exchange } = require('./src/connectExchange.js');
const { getAccountBalance } = require('./src/getAccountBalance.js');
const { getPortfolioBalance } = require('./src/getPortfolioBalance.js');
const { getSpotMarketsUSDT } = require('./src/getSpotMarketsUSDT.js');
const { getTicker } = require('./src/getTicker.js');
const { createMarketOrder } = require('./src/createMarketOrder.js');
const { getOrder } = require('./src/getOrder.js');
const { countDecimals } = require('./src/utils/utils.js')


const defaultQuoteCurrency = 'USDT';

const strategy = {
        id: 1,
        ts: 1676631611,
        assets: {
            'BTC': 0.4,
            'ETH': 0.3,
            'BIT': 0.2,
            'USDT': 0.1
        },
        version: 1,
        event: 'Strategie Created',
};




async function rebalancePortfolio(strategy) {
  const portfolioBalance = await getPortfolioBalance(strategy);
  console.log(portfolioBalance);

  // Load all USDT Pairs to get limits and precisions
  // TODO: I could query it only once and pass it as argument
  const spotMarkets = await getSpotMarketsUSDT();

  const assetsToBuy = {};
  const assetsToSell = {};
  const orderIds = []; // array to store order IDs

  const debug = [];
  let i = 0;

  
  for (const currency of Object.keys(strategy.assets)) {

    // Calculate current allocation & targetted allocation
    const targetAllocationUSDT = strategy.assets[currency] * portfolioBalance.total;
    const targetAllocationPercent = strategy.assets[currency];
    const currentAllocationUSDT = portfolioBalance.assets[currency].totalUSDT;
    const currentAllocationPercent = parseFloat((currentAllocationUSDT/portfolioBalance.total).toFixed(2));
    const differenceUSDT = targetAllocationUSDT - currentAllocationUSDT; // How much we should buy / sell in USDT
    const differencePercent = targetAllocationPercent - currentAllocationPercent // E.g.: If current 0.401 while target is 0.401 then we should rebalance, aka difference is >= 0.001

    debug[i] = {

      currency: currency,
      targetPercent: targetAllocationPercent,
      targetUSDT: targetAllocationUSDT,
      currentPercent: currentAllocationPercent,
      currentUSDT: currentAllocationUSDT,
      diffPercent: differencePercent,
      diffUSDT: differenceUSDT,
      total: portfolioBalance.total
      
    }; 
    
    if (currency !== defaultQuoteCurrency) { // Skip to avoid USDT/USDT pair.
      if (Math.abs(differencePercent) >= 0.001 ) { // If current 0.401 while target is 0.401 then we should rebalance, aka difference is >= 0.001
        try {
          
          // Prepare the market order details
          const side = Math.sign(differenceUSDT) === 1 ? 'buy' : 'sell';
          const price = await getTicker(currency, 'USDT'); // Current price (bid, ask, last) of the asset in USDT
          const precision = {
            amount: countDecimals(spotMarkets[currency].precision.amount),
            price: countDecimals(spotMarkets[currency].precision.price),
          };
          let amount = 0; // Init amount to buy/sell for the given currency

          if (side === 'buy') {
            orderQty = parseFloat((Math.abs(differenceUSDT) / price.ask).toFixed(precision.amount)) // Calculate amount considering the precision (max number of decimals) provided by the exchange
            orderPrice = parseFloat((orderQty * price.ask).toFixed(precision.price));
            assetsToBuy[currency] = {
              orderQty: orderQty,
              orderPrice: orderPrice,
              bid: price.bid,
              ask: price.ask,
              last: price.last,
            }
          }
          else if (side === 'sell') {
            orderQty = parseFloat((Math.abs(differenceUSDT) / price.bid).toFixed(precision.amount)) // Calculate amount considering the precision (max number of decimals) provided by the exchange
            orderPrice = parseFloat((orderQty * price.bid).toFixed(precision.price));
            assetsToBuy[currency] = {
              orderQty: orderQty,
              orderPrice: orderPrice,
              bid: price.bid,
              ask: price.ask,
              last: price.last,
            }
          }
          console.log('Assets to sell');
          console.log(assetsToSell);
          console.log('Assets to buy');
          console.log(assetsToBuy);


        } catch(err) {
          console.log(err);
        }
      }
    }

    for (const currency of Object.keys(assetsToSell)) { // Looping on currencies to sell first to provide liquidity
      if (assetsToSell[currency].orderQty > limits.amount.min && assetsToSell[currency].orderQty < limits.amount.max) {
        const order = await createMarketOrder(`${currency}/${defaultQuoteCurrency}`, 'sell', assetsToSell[currency].orderQty);
        orderIds.push(order.id);
      }
    }

    for (const currency of Object.keys(assetsToBuy)) {
      if (assetsToBuy[currency].orderQty > limits.amount.min && assetsToBuy[currency].orderQty < limits.amount.max) {
        if (assetsToBuy[currency].orderPrice > limits.cost.min && assetsToBuy[currency].orderPrice < limits.cost.max) {
          const order = await createMarketOrder(`${currency}/${defaultQuoteCurrency}`, 'buy', assetsToBuy[currency].amount, ask);
          orderIds.push(order.id);
        }
      }
    }

    i++;
  }
  console.table(debug);

}

rebalancePortfolio(strategy);


