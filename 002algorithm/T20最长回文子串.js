var longestPalindrome = function(s) {
    const n = s.length;
    if (n <= 1) return s;
    const dp = Array.from({length: n}, () => Array(n).fill(false));
    let res = 1, start = 0;
    for (let i = 0; i < n; i++) {
        dp[i][i] = true;
    }
    for (let len = 2; len <= n; len++ ) {
        for (let left = 0; left + len - 1 < n; left++) {
            let right = left + len - 1;
            if (s[left] === s[right] && (dp[left+1][right-1] || len <= 3))  {
                dp[left][right] = true;
                if (len > res) {
                    start = left;
                    res = len;                
                }
            }
        }
    }
    return s.substring(start, start + res);
}