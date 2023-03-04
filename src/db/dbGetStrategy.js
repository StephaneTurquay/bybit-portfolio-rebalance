const { supabase } = require('./dbConnector.js');

async function dbGetStrategy(strategyId) {
    try {
        
        const { data, error } = await supabase
        .from('strategies')
        .select('assets')
        .eq('id', strategyId, { useParameterizedQueries: true });
        
        if (error) {

            throw new Error(`Error getting strategy details: ${error}`);

        }
        else if (data.length === 1) {

            return data[0].assets;

        }
        else if (data.length > 1) {

            throw new Error(`${data.length} results returned. Only one expected.`);
        }
        else if (data.length === 0) {

            throw new Error(`No strategy matching with the given Id: ${strategyId}`);

        }
    }
    catch(err) {
        console.log(`Error getting the strategy. ${err}`);
    }
    



}

module.exports = { dbGetStrategy };