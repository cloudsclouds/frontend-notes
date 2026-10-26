/**
 * LeetCode 39. 组合总和
 * @param {number[]} candidates
 * @param {number} target
 * @return {number[][]}
 */
var combinationSum = function(candidates, target) {
    const res = [];
    const path = [];

    function dfs(start, sum) {
        if (sum === target) {
            res.push([...path]);
            return;
        }

        if (sum > target) return;

        for (let i = start; i < candidates.length; i++) {
            path.push(candidates[i]);
            dfs(i, sum + candidates[i]);
            path.pop();
        }
    }

    dfs(0, 0);
    return res;
};
