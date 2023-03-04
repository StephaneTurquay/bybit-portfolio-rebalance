async function rebalancePortfolio(strategy) {
  const portfolioBalance = await getPortfolioBalance(strategy);
  console.log(portfolioBalance);

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
    const differencePercent = currentAllocationPercent - targetAllocationPercent

    //console.log(`${targetAllocation}, ${targetAllocationPercent}, ${currentAllocation}. ${currentAllocationPercent}, ${difference}, ${differencePercent}`);

    console.log(`${currency} -- targetAllocation: ${targetAllocation} -- currentAllocation: ${currentAllocation} -- Difference: ${difference}`);

    // NO MATTER THE ASSET PRICE, THE USDT DIFFERENCE TO BUY/SELL IS CORRECT!

    //TODO: Include getTicket data in assetsToBuy/Sell so we don't query one more time just before placing the order
    if (currency !== defaultQuoteCurrency) {
      if (Math.abs(differencePercent) >= 0.001 ) { // Difference is move than 0.1pp

        try {
          const side = Math.sign(difference) === 1 ? 'buy' : 'sell';
          const price = await getTicker(currency, 'USDT');
          const precision = spotMarkets[currency].precision.amount;

          if (side === 'buy') {
            const amount = Math.floor((Math.abs(difference) / price.ask) / precision) * precision;
            assetsToBuy[currency] = {
              amount: amount,
              bid: price.bid,
              ask: price.ask,
              last: price.last,
            }

            console.log(`Rebalancing ${currency} ${side} ${amount} --- Bid ${price.bid}, Ask: ${price.ask}, Last: ${price.last}`);
          }
          else if (side === 'sell') {
            const amount = Math.floor((Math.abs(difference) / price.bid) / precision) * precision;
            assetsToSell[currency] = {
              amount: amount,
              bid: price.bid,
              ask: price.ask,
              last: price.last,
            }
            console.log(`Rebalancing ${currency} ${side} ${amount} --- Bid ${price.bid}, Ask: ${price.ask}, Last: ${price.last}`);
          }
        } catch(err) {
          console.log(`Error for ${currency}/USDT: ${err.message}`);
        }
      }
    }
  }

  
  console.log('Assets to sell');
  console.log(assetsToSell);
  console.log('Assets to buy');
  console.log(assetsToBuy);

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
    
    if ((order && order.status === 'closed') || (order && order.status === 'PARTIALLY_FILLED_CANCELED' && order.remaining === 0)) {
      orderIds.shift(); // remove closed order ID from array
      console.log(`${order.symbol} - Amount: ${order.amount} - Price: ${order.price} - Cost: ${order.cost} - Average: ${order.average}`);
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // wait 1 second before checking next order
  }

  console.log(await getPortfolioBalance(strategy));
  return true;

}