var levelOrder = function(root) {
    if (!root) return [];
    const res = [];
    const queue = [root];
    while (queue.length > 0) {
        const n = queue.length;
        const level = [];
        for (let i = 0; i < n; i++) {
            const node = queue.shift();;
            level.push(node.val);
            if (node.left)  queue.push(node.left);
            if (node.right) queue.push(node.right);
        }
        res.push(level);
    }
    return res;
}