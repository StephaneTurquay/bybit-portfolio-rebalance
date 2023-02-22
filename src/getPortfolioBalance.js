const { getAccountBalance } = require('./getAccountBalance.js');

async function getPortfolioBalance(strategy) {

    try {
        const accountBalance = await getAccountBalance();

        if (!accountBalance || !accountBalance.assets) {
            throw new Error("Unable to retrieve account balance or assets");
        }

        const assets = {};
        let totalUSDTBalance = 0;

        for (const currency of Object.keys(strategy.assets)) {
            const currencyTotal = accountBalance.assets[currency]?.totalUSDT || 0;

            assets[currency] = {
                free: accountBalance.assets[currency]?.free || 0,
                used: accountBalance.assets[currency]?.used || 0,
                total: accountBalance.assets[currency]?.total || 0,
                totalUSDT: currencyTotal,
                allocation: 0
            };

            totalUSDTBalance += currencyTotal;
        }

        for (const currency in assets) {
            assets[currency].allocation = parseFloat((assets[currency].totalUSDT / totalUSDTBalance * 100).toFixed(3));
        }

        return { assets: assets, total: parseFloat(totalUSDTBalance.toFixed(3)) };
    } catch (err) {
        console.log(`Error getting portfolio balance: ${err.message}`);
        throw err;
    }
}

module.exports = { getPortfolioBalance };