var lengthOfLIS = function(nums) {
    const n = nums.length;
    const dp = Array(n).fill(1);
    let res = 1;
    const ans = [];
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < i; j++) {
            if (nums[j] < nums[i]) {
                dp[i] = Math.max(dp[i], dp[j] + 1);
            }
        }
        if (ans < dp[i]) {
            ans = dp[i];
            res.push(nums[i]);
        }
    }
    return ans, res;
}