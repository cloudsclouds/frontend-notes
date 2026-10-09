/**
 * @param {number[]} nums
 * @return {number[][]}
 */
var threeSum = function(nums) {
    const n = nums.length;
    nums.sort((a, b) => a - b);
    const res = [];
    for (let i = 0; i < n; i++) {
        if (i !== 0 && nums[i] === nums[i-1])   continue;
        let left = i + 1;
        let right = n - 1;
        while (left < right) {
            const sum = nums[i] + nums[left] + nums[right];
            if (sum === 0) {
                res.push([nums[i], nums[left], nums[right]]);
                while (left < right && nums[left] === nums[left+1]) left++;
                while (left < right && nums[right] === nums[right-1])   right--;
                left++;
                right--;
            } else if (sum > 0) {
                right--;
            } else {
                left++;
            }
        }
    }
    return res;
};

/**
 * @param {string} s
 * @return {string}
 */
var longestPalindrome = function(s) {
    const n = s.length;
    if (n <= 1) return s;
    let resLen = 1;
    let start = 0;
    const dp = Array.from({length: n}, ()=> Array(n).fill(false));
    for (let i = 0; i < n; i++) {
        dp[i][i] = true;   
    }
    for (let len = 2; len <= n; len++) {
        for (let i = 0; i + len - 1< n; i++) {
            let j = i + len - 1;
            if (s[i] === s[j] && (dp[i+1][j-1] || len <= 3)) {
                dp[i][j] = true;
                if (len > resLen) {
                    start = i;
                    resLen = len;
                }
            }
        }
    }
    return s.substring(start, start+ resLen);
};

/**
 * @param {string} text1
 * @param {string} text2
 * @return {number}
 */
var longestCommonSubsequence = function(text1, text2) {
    const n1 = text1.length;
    const n2 = text2.length;
    const dp = Array.from({length: n1+1}, ()=> Array(n2+1).fill(0));
    for (let i = 1; i <= n1; i++) {
        for (let j = 1; j <= n2; j++) {
            if (text1[i-1] === text2[j-1]) {
                dp[i][j] = dp[i-1][j-1]+1;
            } else {
                dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
            }
        }
    }
    return dp[n1][n2];
};