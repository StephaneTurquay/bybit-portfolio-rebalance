const { exchange } = require('./connectExchange.js');
const { getTicker } = require('./getTicker.js');

async function getAccountBalance() {
    try {
        const balance = await exchange.fetchBalance();

        const assets =  {};
        let totalBalance = 0;
        let totalUSDTBalance = 0;

        for (const currency in balance.free) {

            const currencyTotal = balance[currency]?.total || 0;

            let totalUSDT = 0;
            if (currency !== 'USDT') {
                const price = await getTicker(currency, 'USDT');
                totalUSDT = currencyTotal * price.last;
            } else {
                totalUSDT = currencyTotal;
            }

            if (balance[currency].total !== 0) {
                
                assets[currency] = {
                    free: balance[currency].free || 0,
                    used: balance[currency].used || 0,
                    total: currencyTotal,
                    totalUSDT: parseFloat(totalUSDT.toFixed(3)),
            };
            totalUSDTBalance += totalUSDT;
            }
        }
        return { assets: assets, total: parseFloat(totalUSDTBalance.toFixed(3)) };
    } catch (err) {
        console.log(`Error getting account balance: ${err.message}`);
        throw err;
    }
}

module.exports = { getAccountBalance };