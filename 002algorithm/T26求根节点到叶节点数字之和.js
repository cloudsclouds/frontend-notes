var sumNumbers = function(root) {
    let res = 0;
    const dfs = (root, sum) => {
        if (!root) return;
        const nextSum = sum * 10 + root.val;
        if (!root.left && !root.right)
            res += nextSum;
        dfs(root.left, nextSum);
        dfs(root.right, nextSum);
    }
    dfs(root, 0);
    return res;
};