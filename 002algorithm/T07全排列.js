var permute = function(nums) {
    const n = nums.length;
    const visited = Array(n).fill(false);
    const res = [];

    const dfs = (path) => {
        if (path.length === n) {
            res.push([...path]);
            return;
        }

        for (let i = 0; i < n; i++) {
            if (!visited[i]) {
                visited[i] = true;
                path.push(nums[i]);
                dfs(path);
                path.pop(nums[i]);
                visited[i] = false;
            }
        }
    }

    dfs([]);
    return res;
}