const { exchange } = require('./src/connectExchange.js');
const { getAccountBalance } = require('./src/getAccountBalance.js');
const { getPortfolioBalance } = require('./src/getPortfolioBalance.js');
const { getSpotMarketsUSDT } = require('./src/getSpotMarketsUSDT.js');
const { getTicker } = require('./src/getTicker.js');
const { createMarketOrder } = require('./src/createMarketOrder.js');
const { getOrder } = require('./src/getOrder.js');


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
  const spotMarkets = await getSpotMarketsUSDT();

  const assetsToBuy = {};
  const assetsToSell = {};
  const orderIds = []; // array to store order IDs
  
  for (const currency of Object.keys(strategy.assets)) {
    const targetAllocation = strategy.assets[currency] * portfolioBalance.total;
    const targetAllocationPercent = strategy.assets[currency];
    const currentAllocation = portfolioBalance.assets[currency].totalUSDT;
    const currentAllocationPercent = currentAllocation/portfolioBalance.total;
    const difference = targetAllocation - currentAllocation;
    const differencePercent = currentAllocationPercent - targetAllocationPercent;

    console.log(`${targetAllocation}, ${targetAllocationPercent}, ${currentAllocation}. ${currentAllocationPercent}, ${difference}, ${differencePercent}`);

    console.log(`${currency} -- targetAllocation: ${targetAllocation} -- currentAllocation: ${currentAllocation} -- Difference: ${difference}`);

    //TODO: Include getTicket data in assetsToBuy/Sell so we don't query one more time just before placing the order
    if (currency !== defaultQuoteCurrency) {
      if (Math.abs(differencePercent) >= 0.001 ) { // Difference is move than 0.1pp
        console.log(Math.abs(differencePercent));

        try {
          const side = Math.sign(difference) === 1 ? 'buy' : 'sell';
          const price = await getTicker(currency, 'USDT');
          const precision = spotMarkets[currency].precision.amount;

          if (side === 'buy') {
            const amount = Math.floor((Math.abs(difference) / price.ask) / precision) * precision;
            console.log(`Amount: ${amount}`);
            assetsToBuy[currency] = {
              amount: amount,
              bid: price.bid,
              ask: price.ask,
            }

            //console.log(`Rebalancing ${currency} ${side} ${amount} --- ${JSON.stringify(spotMarkets[currency], null, 2)}`);
          }
          else if (side === 'sell') {
            const amount = Math.floor((Math.abs(difference) / price.bid) / precision) * precision;
            assetsToSell[currency] = {
              amount: amount,
              bid: price.bid,
              ask: price.ask,
            }
            //console.log(`Rebalancing ${currency} ${side} ${amount} --- ${JSON.stringify(spotMarkets[currency], null, 2)}`);
          }
        } catch(err) {
          console.log(`Error getting aaa for ${currency}/USDT: ${err.message}`);
        }
      }
    }
  }

  for (const currency of Object.keys(assetsToSell)) {
    const bid = assetsToSell[currency].bid;
    const limits = spotMarkets[currency].limits;
      
    if (assetsToSell[currency].amount > limits.amount.min && assetsToSell[currency].amount < limits.amount.max) {

      console.log(`${currency} -- ${limits.amount.min} -- ${limits.cost.min}`)

      console.log(`SELL: ${currency}/${defaultQuoteCurrency}, Amount: ${assetsToSell[currency].amount}, Price ${bid},  Limit: ${spotMarkets[currency].limits.amount.min}`);
      const order = await createMarketOrder(`${currency}/${defaultQuoteCurrency}`, 'sell', assetsToSell[currency].amount);
      orderIds.push(order.id);
    }
  }
  for (const currency of Object.keys(assetsToBuy)) {
    const ask = assetsToBuy[currency].ask;
    const limits = spotMarkets[currency].limits;

    console.log(ask);

    if (assetsToBuy[currency].amount > limits.amount.min && assetsToBuy[currency].amount < limits.amount.max) {
      if (ask*assetsToBuy[currency].amount > limits.cost.min && ask*assetsToBuy[currency].amount < limits.cost.max) {
        console.log(`${currency} -- ${limits.amount.min} -- ${limits.cost.min}`)

        console.log(`BUY: ${currency}/${defaultQuoteCurrency}, Amount: ${assetsToBuy[currency].amount}, Price ${ask}, Limit: ${spotMarkets[currency].limits.amount.min}, ${ask*assetsToBuy[currency].amount}`);
        const order = await createMarketOrder(`${currency}/${defaultQuoteCurrency}`, 'buy', assetsToBuy[currency].amount, ask);
        orderIds.push(order.id);
      }
      else {
        console.log(`${currency}: Order value lower than minimum cost. ${assetsToBuy[currency].amount}, ${limits.cost.min}`);
      }
    }
  }

  // wait for orders to be closed
  while (orderIds.length > 0) {
    const orderId = orderIds[0];
    const order = await getOrder(orderId);
    console.log(order);
    if ((order && order.status === 'closed') || (order && order.status === 'PARTIALLY_FILLED_CANCELED' && order.remaining === 0)) {
      orderIds.shift(); // remove closed order ID from array
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // wait 1 second before checking next order
  }

  console.log(await getPortfolioBalance(strategy));

}

rebalancePortfolio(strategy);


