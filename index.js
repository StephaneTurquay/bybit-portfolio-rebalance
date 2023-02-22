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



