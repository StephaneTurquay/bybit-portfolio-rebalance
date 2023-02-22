const { exchange } = require('./connectExchange.js');

async function getTicker(base, quote) { 
    try {
        const ticker = await exchange.fetchTicker(`${base}/${quote}`);
        return ticker;
    } catch (err) {
        console.log(`Error getting ticker for ${base}/${quote}: ${err.message}`);
        throw err;
    }
}

module.exports = { getTicker };