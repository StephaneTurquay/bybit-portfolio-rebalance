const { exchange } = require('./connectExchange.js');

async function getOrder(orderId) {
    try {
        const order = await exchange.fetchOrder(orderId);
        return {orderId: order.id, ts: order.datetime, symbol: order.symbol, type: order.type, side: order.side, price: order.price, amount: order.amount, cost: order.cost, average: order.average, filled: order.filled, remaining: order.remaining, status: order.status};
    } catch (error) {
        console.error(`Failed to fetch order: ${error}`);
        return null;
    }
}

module.exports = { getOrder };