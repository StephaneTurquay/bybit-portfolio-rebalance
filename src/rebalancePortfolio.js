const { getPortfolioBalance } = require('./getPortfolioBalance.js');
const { getSpotMarketsUSDT } = require('./getSpotMarketsUSDT.js');
const { getTicker } = require('./getTicker.js');
const { calculateMarketOrderQtyPrice } = require('./utils/calculateMarketOrderQtyPrice.js')
const { countDecimals } = require('./utils/utils.js');
const { createMarketOrder } = require('./createMarketOrder.js');
const { v4: uuidv4 } = require('uuid');
const { getOrder } = require('./getOrder.js');
const { defaultQuoteCurrency } = require('../config.js');
const { dbInsertOrder } = require('./db/dbInsertOrder.js');
const { dbCreateBatchId } = require('./db/dbCreateBatchId.js');
const { dbUpdateRebalance } = require('./db/dbUpdateRebalance.js');


async function rebalancePortfolio(strategy) {

    const batchId = uuidv4();
    const newRebalancing = await dbCreateBatchId(batchId, strategy.assets);
    const portfolioBalance = await getPortfolioBalance(strategy);
  
    // Load all USDT Pairs to get limits and precisions
    // TODO: I could query it only once and pass it as argument
    
    const spotMarkets = await getSpotMarketsUSDT();
  
    const assetsToBuy = {};
    const assetsToSell = {};
    const orderIds = []; // array to store order IDs
  
    const results = [];
    let i = 0;
  
    
    for (const currency of Object.keys(strategy.assets)) {
  
      // Calculate current allocation & targetted allocation
      const targetAllocationUSDT = strategy.assets[currency] * portfolioBalance.total;
      const targetAllocationPercent = strategy.assets[currency];
      const currentAllocationCurrency = portfolioBalance.assets[currency].free;
      const currentAllocationUSDT = portfolioBalance.assets[currency].totalUSDT;
      const currentAllocationPercent = parseFloat((currentAllocationUSDT/portfolioBalance.total).toFixed(3));
      const differenceUSDT = targetAllocationUSDT - currentAllocationUSDT; // How much we should buy / sell in USDT
      const differencePercent = targetAllocationPercent - currentAllocationPercent // E.g.: If current 0.401 while target is 0.401 then we should rebalance, aka difference is >= 0.001
  
      results[i] = {
  
        currency: currency,
        targetPct: targetAllocationPercent,
        targetUSDT: parseFloat((targetAllocationUSDT).toFixed(3)),
        currentAmount: currentAllocationCurrency,
        currentPct: currentAllocationPercent,
        currentUSDT: currentAllocationUSDT,
        currentTotal: portfolioBalance.total
        
      }; 
      if (currency !== defaultQuoteCurrency) { // Skip to avoid USDT/USDT pair.
  
        const limits = spotMarkets[currency].limits;
        const fees = {
          taker: spotMarkets[currency].taker,
          maker: spotMarkets[currency].maker
        };
  
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
  
            const { orderQty, orderPrice, approved } = await calculateMarketOrderQtyPrice(side, price, Math.abs(differenceUSDT), precision, limits);
            if (side === 'buy' && approved) {
  
              assetsToBuy[currency] = {
                orderQty: orderQty,
                orderPrice: orderPrice,
                bid: price.bid,
                ask: price.ask,
                last: price.last,
              }
            }
            else if (side === 'sell' && approved) {
  
              assetsToSell[currency] = {
                orderQty: orderQty,
                orderPrice: orderPrice,
                bid: price.bid,
                ask: price.ask,
                last: price.last,
              }
            }
          } catch(err) {
            console.log(err);
          }
        }
      }
      i++;
    }
  
    const clientOrderId = uuidv4();
  
    for (const currency of Object.keys(assetsToSell)) { // Looping on currencies to sell first to provide liquidity
      try {
        const order = await createMarketOrder(`${currency}/${defaultQuoteCurrency}`, 'sell', assetsToSell[currency].orderQty, { clientOrderId: clientOrderId });
        orderIds.push({
          orderId: order.id,
          currency: currency
        });
      } catch(err) {
        console.log(err);
      }
    }
  
    for (const currency of Object.keys(assetsToBuy)) {
      try {
        const order = await createMarketOrder(`${currency}/${defaultQuoteCurrency}`, 'buy', assetsToBuy[currency].orderQty, assetsToBuy[currency].ask, { clientOrderId: clientOrderId });
        orderIds.push({
          orderId: order.id,
          currency: currency
        });
      } catch(err) {
        console.log(err);
      }
    }
  
    while (orderIds.length > 0) {
      const { orderId, currency } = orderIds[0];
      const order = await getOrder(orderId);
      
      if ((order && order.status === 'closed') || (order && order.status === 'PARTIALLY_FILLED_CANCELED' && order.remaining === 0)) {
        orderIds.shift(); // remove closed order ID from array
        const insertOrder = await dbInsertOrder(order.orderId, order.symbol, order.type, order.side, order.amount, order.average, order.cost, order.cost * spotMarkets[currency].taker, order.status, order.ts, batchId);
        const resultsItem = results.find(obj => obj.currency === currency);
        if (resultsItem) {
          resultsItem.orderId = orderId;
          resultsItem.fees = order.cost * spotMarkets[currency].taker;
        }
  
      }
      await new Promise(resolve => setTimeout(resolve, 100)); // wait 100 milisecond before checking next order
    }
  
    const portfolioBalanceFinal = await getPortfolioBalance(strategy);

    const updateRebalancing = await dbUpdateRebalance(batchId, portfolioBalanceFinal.total)
  
    i = 0;
  
    for (const currency of Object.keys(strategy.assets)) {
      currentAllocationCurrency = portfolioBalanceFinal.assets[currency].free;
      currentAllocationUSDT = portfolioBalanceFinal.assets[currency].totalUSDT;
      currentAllocationPercent = parseFloat((currentAllocationUSDT/portfolioBalanceFinal.total).toFixed(3));
  
      results[i].newAmount = currentAllocationCurrency;
      results[i].newPct = currentAllocationPercent;
      results[i].newUSDT = currentAllocationUSDT;
      results[i].newTotal = portfolioBalanceFinal.total;
      results[i].clientOrderId = clientOrderId;
  
      i++;
    }
    console.table(results);
    return results;
  }

  module.exports = { rebalancePortfolio };