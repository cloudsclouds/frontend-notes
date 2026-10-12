var coinChange = function(coins, amount) {
    const dp = Array(amount).fill(Infinity);
    dp[0] = 0;
    for (let i = 1; i <= amount; i++) {
        for (const coin of coins) {
            if (i >= coin) {
                dp[i] = Math.max(dp[i-coin]+1, dp[i]);
            }
        }
    }
    return dp[amount] === Infinity ? -1 : dp[amount];
}
