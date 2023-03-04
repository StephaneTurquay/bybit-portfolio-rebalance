const { supabase } = require('./dbConnector.js');

async function dbInsertOrder(orderId, symbol, type, side, amount, average, cost, fees, status, ts, batchId) {
    try {

        const { data, error } = await supabase
        .from('orders')
        .insert({ orderId: orderId, symbol: symbol, type: type, side: side, amount: amount, average: average, cost: cost, fees: fees, status: status, ts: ts, batchId: batchId})
        .select()
        
        if (error) {

            throw new Error(`Error getting strategy details: ${JSON.stringify(error)}`);

        }
        else {

            return data;
        }
    }
    catch(err) {
        console.log(`Error saving the order. ${err}`);
    }
    



}

module.exports = { dbInsertOrder };