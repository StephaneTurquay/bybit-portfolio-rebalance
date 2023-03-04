const cron = require('cron');
const { rebalancePortfolio } = require('./src/rebalancePortfolio');


const strategy = {
        id: 1,
        ts: 1676631611,
        assets: {
            'BTC': 0.2,
            'ETH': 0.3,
            'BIT': 0.4,
            'USDT': 0.1
        },
        version: 1,
        event: 'Strategy Created',
};

// Create a CronJob to run every week on Sunday at 8
const job1 = new cron.CronJob('0 8 * * 0', function() {
  rebalancePortfolio(strategy);
});

// Start CronJobs
job1.start();