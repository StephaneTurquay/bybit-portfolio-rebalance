const { exchange } = require('./connectExchange.js');

async function createMarketOrder(side, symbol, amount) {
    try {
        // Get the allowed limits and costs for the traded currency
        const spotMarkets = await exchange.loadMarkets();
        const limits = spotMarkets[symbol].limits;

        // Check if the amount is within the allowed limits
        if (amount < limits.amount.min) {
            throw new Error(`Order amount (${amount}) is too low. Minimum amount for ${symbol} is ${limits.amount.min}.`);
        } else if (amount > limits.amount.max) {
            throw new Error(`Order amount (${amount}) is too high. Maximum amount for ${symbol} is ${limits.amount.max}.`);
        }

        // Get last price of the symbol
        const ticker = await exchange.fetchTicker(symbol);
        const lastPrice = ticker.last;
        const askPrice = ticker.ask;
        const bidPrice = ticker.bid;

        // Calculate the cost of the trade
        const cost = lastPrice * amount;

        // Check if the cost is within the allowed limits
        if (cost < limits.cost.min) {
            throw new Error(`Order cost (${cost}) is too low. Minimum cost for ${symbol} is ${limits.cost.min}.`);
        } else if (cost > limits.cost.max) {
            throw new Error(`Order cost (${cost}) is too high. Maximum cost for ${symbol} is ${limits.cost.max}.`);
        }

        // Place the market order
        const order = await exchange.createOrder(symbol, 'market', side, amount, lastPrice);

        console.log(order);

        // Return the order
        return order;
    } catch (err) {
        console.log(`Error creating market order for ${side}, ${symbol}, ${amount}: ${err.message}`);
        throw err;
    }
}

module.exports = { createMarketOrder };
