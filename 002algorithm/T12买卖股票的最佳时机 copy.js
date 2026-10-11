var maxProfit = function(prices) {
    const n = prices.length;
    let minPrice = prices[0];
    let maxProfit = 0;
    for (let i = 0; i < n; i++) {
        minPrice = Math.min(minPrice, prices[i]);
        maxProfit = Math.max(maxProfit, prices[i] - minPrice);
    }
    return maxProfit;
}