const { supabase } = require('./dbConnector.js');

async function dbCreateBatchId(batchId, strategy) {
    try {

        const { data, error } = await supabase
        .from('rebalancing')
        .insert({ batchId: batchId, portfolioId: 1, assets: strategy})
        .select()
        
        if (error) {

            throw new Error(`${error}`);

        }
        else {
            console.log(data);
            return data;
        }
    }
    catch(err) {
        console.log(`Error creating batchId: ${JSON.stringify(err)}`);
    }
}

module.exports = { dbCreateBatchId };