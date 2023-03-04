const { supabase } = require('./dbConnector.js');

async function dbUpdateRebalance(batchId, total) {
    try {

        const { data, error } = await supabase
        .from('rebalancing')
        .update({ total: total})
        .eq('batchId', batchId)
        .select();
        
        if (error) {

            throw new Error(`${error}`);

        }
        else {
            console.log(data);
            return data;
        }
    }
    catch(err) {
        console.log(`Error updating rebalancing by batchId: ${JSON.stringify(err)}`);
    }
}

module.exports = { dbUpdateRebalance };