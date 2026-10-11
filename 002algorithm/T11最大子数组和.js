var maxSubArray = function(nums) {
    const n = nums.length;
    const dp = Array(n).fill(0);
    dp[i] = nums[0];
    let res = nums[0];
    for (let i = 1; i < n; i++) {
        dp[i] = Math.max(nums[i], dp[i-1] + nums[i]);
        res = Math.max(res, dp[i]);
    }
    return res;
}