async function calculateMarketOrderQtyPrice(side, price, amountInUsd, precision, limits) {

    // Calculate the amount of the currency we want to buy or sell based on the amount in USD
    let amount = amountInUsd / price.last;

    // Calculate the minimum amount increment based on the provided precision
    const minAmountIncrement = 1 / Math.pow(10, precision.amount);

    // Calculate the minimum amount required to meet the minimum cost limit
    let minAmount = limits.cost.min / price.last;

    // Round the minimum amount up to the next valid value if necessary
    if (minAmount % minAmountIncrement !== 0) {
        minAmount = Math.ceil(minAmount / minAmountIncrement) * minAmountIncrement;
        minAmount = parseFloat(minAmount.toFixed(precision.amount));
    }

    // Apply the maximum amount limit
    minAmount = Math.min(minAmount, limits.amount.max);

    // If the calculated minimum amount is higher than the current amount, use it instead
    if (minAmount > amount) {
        amount = minAmount;
        // Calculate the new cost based on the adjusted amount
        let cost = price.last * amount;
        cost = parseFloat(cost.toFixed(precision.price));
    }

    // Apply the minimum and maximum amount limits
    amount = Math.max(amount, limits.amount.min);
    amount = Math.min(amount, limits.amount.max);

    // Calculate the total cost of the order
    let cost = price.last * amount;

    // Apply the cost precision
    cost = parseFloat(cost.toFixed(precision.price));

    // Apply the minimum and maximum cost limits
    cost = Math.max(cost, limits.cost.min);
    cost = Math.min(cost, limits.cost.max);

    // Round the orderQty and orderPrice values to the appropriate precision
    const orderQty = parseFloat(amount.toFixed(precision.amount));
    const orderPrice = parseFloat(cost.toFixed(precision.price));

    let approved = true;
    
    if (amountInUsd < limits.cost.min && (1 - orderPrice / amountInUsd) > 0.1) { // If amountInUsd is less than 10% to the minimum amount, we proceed to the order

        approved = false;
    }
    

    return {
        orderQty: orderQty,
        orderPrice: orderPrice,
        approved: approved
    };
}

module.exports = { calculateMarketOrderQtyPrice };




  