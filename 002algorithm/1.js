var restoreIpAddresses = function(s) {
    const res = [];
    const dfs = (start, path) => {
        if (path.length === 4 || start === s.length) {
            res.push(path.join('.'));
            return ;
        }

        let remaining = s.length - start;
        let segmentsLeft = 4 - path.length;

        if (remaining < segmentsLeft || remaining > 3 * left) {
            return ;
        }

        for (let len = 1; len <= 3; len++) {
            if (start + len > s.length) break;
            const segment = s.slice(start, start + len);
            if (segment.length > 1 && segment[0] === '0') {
                continue;
            }
            if (Number(segment) > 255) {
                continue;
            }
            path.push(segment);
            dfs(start + len, path);
            path.pop();
        }
    }
    dfs(0, []);
    return res;
}