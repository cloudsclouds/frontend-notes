/**
 * 二叉树层序遍历及其变体
 * 每次固定当前队列长度，只处理同一层的节点。
 */

// LeetCode 102. 二叉树的层序遍历
var levelOrder = function(root) {
    if (!root) return [];

    const res = [];
    const queue = [root];
    let head = 0;

    while (head < queue.length) {
        const size = queue.length - head;
        const level = [];

        for (let i = 0; i < size; i++) {
            const node = queue[head++];
            level.push(node.val);
            if (node.left) queue.push(node.left);
            if (node.right) queue.push(node.right);
        }

        res.push(level);
    }

    return res;
};

// LeetCode 103. 二叉树的锯齿形层序遍历
var zigzagLevelOrder = function(root) {
    if (!root) return [];

    const res = [];
    const queue = [root];
    let head = 0;
    let leftToRight = true;

    while (head < queue.length) {
        const size = queue.length - head;
        const level = [];

        for (let i = 0; i < size; i++) {
            const node = queue[head++];
            const index = leftToRight ? i : size - 1 - i;
            level[index] = node.val;
            if (node.left) queue.push(node.left);
            if (node.right) queue.push(node.right);
        }

        res.push(level);
        leftToRight = !leftToRight;
    }

    return res;
};

// LeetCode 199. 二叉树的右视图
var rightSideView = function(root) {
    if (!root) return [];

    const res = [];
    const queue = [root];
    let head = 0;

    while (head < queue.length) {
        const size = queue.length - head;

        for (let i = 0; i < size; i++) {
            const node = queue[head++];
            if (i === size - 1) res.push(node.val);
            if (node.left) queue.push(node.left);
            if (node.right) queue.push(node.right);
        }
    }

    return res;
};

// LeetCode 107. 二叉树的层序遍历 II（自底向上）
var levelOrderBottom = function(root) {
    if (!root) return [];

    const res = [];
    const queue = [root];
    let head = 0;

    while (head < queue.length) {
        const size = queue.length - head;
        const level = [];

        for (let i = 0; i < size; i++) {
            const node = queue[head++];
            level.push(node.val);
            if (node.left) queue.push(node.left);
            if (node.right) queue.push(node.right);
        }

        res.unshift(level);
    }

    return res;
};
