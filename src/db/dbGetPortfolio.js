const { supabase } = require('./dbConnector.js');

async function dbGetPortfolio(portfolioId) {
    try {
        const { data, error } = await supabase
        .from(`portfolios_view`)
        .select()
        .eq('portfolio_id', portfolioId, { useParameterizedQueries: true });
        
        if (error) {

            throw new Error(error);

        }
        else if (data.length === 1) {
            return data[0];

        }
        else if (data.length > 1) {

            throw new Error(`${data.length} results returned. Only one expected.`);
        }
        else if (data.length === 0) {

            throw new Error(`No portfolio matching with the given Id: ${portfolioId}`);

        }
    }
    catch(err) {
        console.log(`Error getting the portfolio details. ${err}`);
    } 
}

module.exports = { dbGetPortfolio };