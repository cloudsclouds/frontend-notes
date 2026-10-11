var lengthOfLongestSubstring = function(s) {
    const n = s.length;
    let ans = 0, right = -1;
    const mySet = new Set();
    for (let left = 0; left < n; left ++) {
        if (left !== 0) {
            mySet.delete(s[left-1]);
        } 
        while (right + 1 < n && !mySet.has(s[right + 1])) {
            mySet.add(s[right+1]);
            right++;
        }
        ans = Math.max(ans, right-left+1);
    }
    return ans;
}