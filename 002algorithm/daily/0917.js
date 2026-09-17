/**
 * @param {string} s
 * @return {number}
 */
var lengthOfLongestSubstring = function(s) {
    const mySet = new Set();
    let ans = 0;
    const n = s.length;
    let right = -1;
    for (let left = 0; left < n; left ++) { 
        if (left !== 0) {
            mySet.delete(s[left-1]);
        }
        while (right + 1 < n && !mySet.has(s[right+1])) {
            mySet.add(s[right+1]);
            right++;
        }
        ans = Math.max(right-left+1, ans);
    }

    return ans;
};

/**
 * @param {string} version1
 * @param {string} version2
 * @return {number}
 */
var compareVersion = function(version1, version2) {
    const v1 = version1.split(".");
    const v2 = version2.split(".");
    const n1 = v1.length, n2 = v2.length;
    for (let i = 0; i < n1 || i < n2; i++) {
        const num1 = Number(v1[i]) || 0;
        const num2 = Number(v2[i]) || 0;
        if (num1 < num2) {
            return -1;
        } 
        if (num1 > num2) {
            return 1;
        }
    }
    return 0;
};