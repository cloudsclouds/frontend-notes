var generateParenthesis = function(n) {
    const res = [];
    const dfs = (left, right, path) => {
        if (path.length === 2 * n) {
            res.push(path);
            return;
        }
        if (left < n) {
            dfs(left+1, right, path + '(');
        }
        if (right < left) {
            dfs(left, right + 1, path + ')');
        }
    }

    dfs(0, 0, '');
    return res;
}