## 1. 二分查找

```js
var search = function(nums, target) {
    let left = 0, right = nums.length - 1;
    while(left <= right) {
        const mid = left + Math.floor((right - left) / 2);
        if (nums[mid] === target) {
            return mid;
        } else if (nums[mid] > target) {
            right = mid - 1;
        } else {
            left = mid + 1;
        }
    }
    return -1;
};
```

# 排序

## 2. 合并两个有序数组

```js
var merge = function(nums1, m, nums2, n) {
    let p1 = 0, p2 = 0;
    const sorted = new Array(m + n).fill(0);
    let cur = 0;
    while (p1 < m && p2 < n){
        if (nums1[p1] < nums2[p2]){
            sorted[cur++] = nums1[p1++];
        }else{
            sorted[cur++] = nums2[p2++];
        }
    }
    while (p1 < m){
        sorted[cur++] = nums1[p1++];
    }
    while (p2 < n){
        sorted[cur++] = nums2[p2++];
    }
};
```

## 3. 合并两个有序链表

```js
var mergeTwoLists = function(list1, list2) {
    const dummy = new ListNode(-1);
    let p = list1, q = list2;
    let k = dummy;
    while (p && q) {
        if (p.val <= q.val) {
            k.next = p;
            p = p.next;
        } else {
            k.next = q;
            q = q.next;
        }
        k = k.next;
    }
    if (p) {
        k.next = p;
    }
    if (q) {
        k.next = q;
    }
    return dummy.next;
};
```

## 4. 快速排序

```js
var sortArray = function(nums) {
    const QuickSort = (nums, left, right) => {
        if (left >= right) return;
        const m = partition(nums, left, right);
        QuickSort(nums, left, m-1);
        QuickSort(nums, m+1, right);
    }

    const partition = (nums, left, right) => {
        const randomIndex = left +  Math.floor(Math.random()* (right-left+1));
        [nums[randomIndex], nums[left]] = [nums[left], nums[randomIndex]];
        const pivot = nums[left];
        while (left < right) {
            while (left < right && pivot <= nums[right])    right--;
            nums[left] = nums[right];
            while (left < right && pivot > nums[left])    left++;
            nums[right] = nums[left];
        } 
        nums[left] = pivot;
        return left;
    }

    QuickSort(nums, 0, nums.length-1);
    return nums;
};
```

# 哈希

## 5. 两数之和

```js
var twoSum = function(nums, target) {
    const myMap = new Map();
    const n = nums.length;
    for (let i = 0; i < n; i++) {
        const need = target - nums[i];
        if (myMap.has(need)){
            return [myMap.get(need), i];
        } else {
            myMap.set(nums[i], i);
        }
    }
};
```

# 双指针

## 6. 移动零

right 指针负责遍历数组，left 指针指向下一个非零元素应该放的位置。
当 right 遇到非零元素时，就和 left 位置交换，并让 left 前进一位。
这样可以保证所有非零元素按顺序移动到数组前面，而 0 会自然被挤到后面。

```js
var moveZeroes = function(nums) {
    let left = 0, right = 0;
    for (right = 0; right < nums.length; right ++) {
        if (nums[right] !== 0) {
            [nums[left], nums[right]] = [nums[right], nums[left]];
            left ++;
        }
    }
    return nums;
};
```

## 7. 三数之和

先对数组排序，然后固定第一个数 first。
接着使用双指针 second 和 third，在剩余区间寻找另外两个数，使三数之和为 0。
如果和大于 0，就移动右指针；如果小于 0，就移动左指针。
同时需要对 first 和 second 做去重处理，避免重复答案。

```js
var threeSum = function(nums) {
    const n = nums.length;
    nums.sort((a,b) => a-b);
    const res = [];
    for (let i = 0; i < n; i++) {
        if (i !== 0 && nums[i] === nums[i-1])   continue;
        let left = i + 1;
        let right = n - 1;
        while (left < right) {
            const sum = nums[i] + nums[left] + nums[right];
            if (sum === 0) {
                res.push([nums[i], nums[left], nums[right]]);
                while (left < right && nums[left] === nums[left+1]) left++;
                while (left < right && nums[right] === nums[right-1]) right--;
                left ++;
                right --;
            } else if ( sum > 0 ) {
                right --;
            } else {
                left ++;
            }
        }
    }
    return res;
};
```

# 贪心

## 8. 买卖股票的最佳时机

```js
var maxProfit = function(prices) {
    let minPrice = prices[0];
    let maxProfit = 0;
    for (let i = 1; i < prices.length; i ++) {
        minPrice = Math.min(prices[i], minPrice);
        maxProfit = Math.max(prices[i] - minPrice, maxProfit);
    }
    return maxProfit;
};
```

## 9. 跳跃游戏

如果：`maxReach < i`，说明：当前位置 i 根本到不了
否则更新最远距离：`Math.max(maxReach, nums[i] + i)`

```js
var canJump = function(nums) {
    let maxReach = 0;
    for (let i = 0; i < nums.length; i++) {
        if (maxReach < i)   return false;
        maxReach = Math.max(maxReach, nums[i] + i);
    }
    return true;
};
```

# DP

## 10. 爬楼梯

```js
var climbStairs = function(n) {
    const dp = new Array(n+1).fill(0);
    dp[0] = 1;
    dp[1] = 1;
    for (let i = 2; i <= n; i++){
        dp[i] = dp[i-1] + dp[i-2];
    }
    return dp[n];
};
```

## 11. 打家劫舍

一个专业的小偷，计划偷窃沿街的房屋。每间房内都藏有一定的现金，影响小偷偷窃的唯一制约因素就是相邻的房屋装有相互连通的防盗系统，如果两间相邻的房屋在同一晚上被小偷闯入，系统会自动报警。
给定一个代表每个房屋存放金额的非负整数数组 nums ，请计算 不触动警报装置的情况下 ，一夜之内能够偷窃到的最高金额。

```js
var rob = function(nums) {
    const n = nums.length;
    const dp = Array(n).fill(0);
    dp[0] = nums[0];
    dp[1] = Math.max(nums[0], nums[1]);
    for (let i = 2; i < n; i++) {
        dp[i] = Math.max(dp[i-2] + nums[i], dp[i-1]);
    }
    return dp[n-1];
};
```

## 12. 最大子数组和

```js
var maxSubArray = function(nums) {
    const n = nums.length;
    const dp = Array(n).fill(0);
    dp[0] = nums[0];
    let res = nums[0];
    for (let i = 1; i < n; i++) {
        dp[i] = Math.max(dp[i-1] + nums[i], nums[i]);
        res = Math.max(res, dp[i]);
    }
    return res;
};
```

## 13. 最长递增子序列

```js
var lengthOfLIS = function(nums) {
    const n = nums.length;
    const dp = Array(n).fill(1);
    let ans = 1;
    for (let i = 1; i < n; i++) {
        for (let j = 0; j < i; j++) {
            if (nums[i] > nums[j]) {
                dp[i] = Math.max(dp[j]+1, dp[i]);
            }
        }
        ans = Math.max(ans, dp[i]);
    }
    return ans;
};
```

## 14. 零钱兑换

给定不同面额的硬币 coins 和一个总金额 amount。编写一个函数来计算可以凑成总金额所需的最少的硬币个数。如果没有任何一种硬币组合能组成总金额，返回 -1。
你可以认为每种硬币的数量是无限的。
`dp[i]` = 凑出金额 i 的最少硬币数

```js
var coinChange = function(coins, amount) {
    const dp = new Array(amount+1).fill(Infinity);
    dp[0] = 0;
    for (let i = 1; i <= amount; i++) {
        for (const coin of coins) {
            if (coin <= i) {
                dp[i] = Math.min(dp[i], dp[i-coin] + 1);
            }
        }
    }
    return dp[amount] === Infinity ? -1 : dp[amount];
};
```

## 15. 不同路径

`dp[i][j] = dp[i-1][j] + dp[i][j-1] = 到达(i,j)的路径数`
第一行 = 1，第一列 = 1

```js
var uniquePaths = function(m, n) {
    const dp = Array.from({length: m}, () => Array(n).fill(1));
    for (let i = 1; i < m; i++) {
        for (let j = 1; j < n; j++) {
            dp[i][j] = dp[i-1][j] + dp[i][j-1];
        }
    }
    return dp[m-1][n-1];
};
```

## 16. 最小路径和

尤其注意初始化路径：dp[0][0] = grid[0][0]，第一行：累加，第一列：累加
dp[i][j] = 到(i,j)的最小路径和 = min(上, 左) + 当前值

```js
var minPathSum = function(grid) {
    const m = grid.length;
    const n = grid[0].length;
    const dp = Array.from({ length: m }, () => Array(n).fill(0));
    dp[0][0] = grid[0][0];
    for (let i = 1; i < m; i++) {
        dp[i][0] = dp[i-1][0] + grid[i][0];
    }
    for (let j = 1; j < n; j++) {
        dp[0][j] = dp[0][j-1] + grid[0][j];
    }
    for (let i = 1; i < m; i++) {
        for (let j = 1; j < n; j++) {
            dp[i][j] = Math.min(dp[i-1][j], dp[i][j-1]) + grid[i][j];
        }
    }
    return dp[m-1][n-1];
};
```

## 17. 最长回文子串

dp[i][j] = s[i..j] 是否是回文

```js
s[i] === s[j] && (j-i <= 2 || dp[i+1][j-1])
    dp[i][i] = true
```

```js
var longestPalindrome = function(s) {
    const n = s.length;
    if (n <= 1) return s;
    const dp = Array.from({length: n}, () => Array(n).fill(false));
    let res = 1, start = 0;
    for (let i = 0; i < n; i++) {
        dp[i][i] = true;
    }
    for (let len = 2; len <= n; len++) {
        for (let left = 0; left + len - 1 < n; left++) {
            let right = left + len - 1;
            if (s[left] === s[right] && (len <= 3 || dp[left+1][right-1])) {
                dp[left][right] = true;
                if (len > res) {
                    start = left;
                    res = len;
                }
            }
        }
    }
    return s.substring(start, start + res);
};
```

## 18. 最长公共子序列

dp[i][j] = 前i个 & 前j个 的最长公共子序列长度
相等：dp[i][j] = dp[i-1][j-1] + 1
不等：dp[i][j] = max(dp[i-1][j], dp[i][j-1])
dp[0][j] = 0
dp[i][0] = 0

```js
var longestCommonSubsequence = function(text1, text2) {
    const m = text1.length;
    const n = text2.length;
    const dp = Array.from({length: m+1}, () => Array(n+1).fill(0));
    
    for (let i = 1; i < m+1; i ++) {
        for (let j = 1; j < n + 1; j++) {
            if (text1[i-1] === text2[j-1]) {
                dp[i][j] = dp[i-1][j-1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
            }
        }
    }
    return dp[m][n];
};
```

# 字符串
## 19. 版本比较
给你两个 版本号字符串 version1 和 version2 ，请你比较它们。版本号由被点 '.' 分开的修订号组成。修订号的值 是它 转换为整数 并忽略前导零。
比较版本号时，请按 从左到右的顺序 依次比较它们的修订号。如果其中一个版本字符串的修订号较少，则将缺失的修订号视为 0。
```js
var compareVersion = function(version1, version2) {
    const v1 = version1.split(".");
    const v2 = version2.split(".");
    let i = 0;
    for (let i = 0; i < v1.length || i < v2.length; i++){
        let x = Number(v1[i]) || 0;
        let y = Number(v2[i]) || 0;
        if (x < y) return -1;
        else if (x > y) return 1;
    }
    return 0;
};
```

## 20. 字符串相加
```js
var addStrings = function(num1, num2) {
    const res = [];
    let carry = 0;
    for (let i = num1.length - 1, j = num2.length - 1; i >= 0 || j >= 0; i--, j--) {
        let x = Number(num1[i]) || 0;
        let y = Number(num2[j]) || 0;
        let sum = x + y + carry;
        res.push(sum % 10);
        carry = Math.floor(sum / 10);
    }
    if (carry) {
        res.push(carry);
    }
    return res.reverse().join('');
};
```


# 二叉树

## DFS 遍历

### 19. 中序 / 前序 / 后序通用模板
```js
const dfs = (root) => {
    if (!root) return;

    // 前序：处理当前节点
    // dfs(root.left);

    // 中序：处理当前节点
    // dfs(root.right);

    // 后序：处理当前节点
};
```

### 20. 二叉树的中序遍历
```js
var inorderTraversal = function(root) {
    const res = [];
    const dfs = (node) => {
        if (!node) return;
        dfs(node.left);
        res.push(node.val);
        dfs(node.right);
    };
    dfs(root);
    return res;
};
```

## 路径类 DFS

这类题的核心就两件事

- `path / sum / state` 作为递归参数向下传
- 到叶子节点时做一次结算

### 21. 路径总和
```js
var hasPathSum = function(root, targetSum) {
    if (!root) return false;
    if (!root.left && !root.right) {
        return root.val === targetSum;
    }
    const nextTarget = targetSum - root.val;
    return hasPathSum(root.left, nextTarget) || hasPathSum(root.right, nextTarget);
};
```

### 22. 二叉树的所有路径
```js
var binaryTreePaths = function(root) {
    const res = [];
    const dfs = (node, path) => {
        if (!node) return;

        const nextPath = path ? `${path}->${node.val}` : `${node.val}`;
        if (!node.left && !node.right) {
            res.push(nextPath);
            return;
        }

        dfs(node.left, nextPath);
        dfs(node.right, nextPath);
    };

    dfs(root, "");
    return res;
};
```

### 23. 求根到叶子节点数字之和
```js
var sumNumbers = function(root) {
    let total = 0;

    const dfs = (node, currentSum) => {
        if (!node) return;

        const nextSum = currentSum * 10 + node.val;
        if (!node.left && !node.right) {
            total += nextSum;
            return;
        }

        dfs(node.left, nextSum);
        dfs(node.right, nextSum);
    };

    dfs(root, 0);
    return total;
};
```

## 后序聚合

这类题的统一思路是：

- 先拿到左右子树的信息
- 再在当前节点做汇总

### 24. 二叉树的最大深度
```js
var maxDepth = function(root) {
    if (!root) return 0;
    const left = maxDepth(root.left);
    const right = maxDepth(root.right);
    return Math.max(left, right) + 1;
};
```

### 25. 二叉树的最大直径
```js
var diameterOfBinaryTree = function(root) {
    let res = 0;

    const dfs = (node) => {
        if (!node) return 0;
        const left = dfs(node.left);
        const right = dfs(node.right);
        res = Math.max(res, left + right);
        return Math.max(left, right) + 1;
    };

    dfs(root);
    return res;
};
```

### 26. 二叉树的最近公共祖先
```js
var lowestCommonAncestor = function(root, p, q) {
    if (!root || root === p || root === q) return root;

    const left = lowestCommonAncestor(root.left, p, q);
    const right = lowestCommonAncestor(root.right, p, q);

    if (left && right) return root;
    return left ? left : right;
};
```

## 树结构变换

### 27. 反转二叉树
```js
var flipTree = function(root) {
    if (!root) return null;
    [root.left, root.right] = [root.right, root.left];
    flipTree(root.left);
    flipTree(root.right);
    return root;
};
```

### 28. 对称二叉树
```js
var checkSymmetricTree = function(root) {
    if (!root) return true;

    const dfs = (t1, t2) => {
        if (!t1 && !t2) return true;
        if (!t1 || !t2) return false;
        if (t1.val !== t2.val) return false;
        return dfs(t1.left, t2.right) && dfs(t1.right, t2.left);
    };

    return dfs(root, root);
};
```

### 29. 从前序与中序遍历序列构造二叉树
```js
var buildTree = function(preorder, inorder) {
    if (!preorder.length || !inorder.length) return null;

    const rootVal = preorder[0];
    const root = new TreeNode(rootVal);
    const index = inorder.indexOf(rootVal);

    const leftInorder = inorder.slice(0, index);
    const rightInorder = inorder.slice(index + 1);
    const leftPreorder = preorder.slice(1, 1 + leftInorder.length);
    const rightPreorder = preorder.slice(1 + leftInorder.length);

    root.left = buildTree(leftPreorder, leftInorder);
    root.right = buildTree(rightPreorder, rightInorder);
    return root;
};
```

## 层序遍历

这组题本质上都能抽成同一个 BFS 框架，只是“每层怎么取结果”不一样。

### 30. 基础层序遍历
```js
var levelOrder = function(root) {
    if (!root) return [];

    const res = [];
    const queue = [root];

    while (queue.length) {
        const size = queue.length;
        const level = [];

        for (let i = 0; i < size; i++) {
            const node = queue.shift();
            level.push(node.val);
            if (node.left) queue.push(node.left);
            if (node.right) queue.push(node.right);
        }

        res.push(level);
    }

    return res;
};
```

### 31. 锯齿形层次遍历
```js
var zigzagLevelOrder = function(root) {
    if (!root) return [];

    const res = [];
    const queue = [root];
    let leftToRight = true;

    while (queue.length) {
        const size = queue.length;
        const level = [];

        for (let i = 0; i < size; i++) {
            const node = queue.shift();
            if (leftToRight) level.push(node.val);
            else level.unshift(node.val);
            if (node.left) queue.push(node.left);
            if (node.right) queue.push(node.right);
        }

        res.push(level);
        leftToRight = !leftToRight;
    }

    return res;
};
```

### 32. 二叉树的右视图
```js
var rightSideView = function(root) {
    if (!root) return [];

    const res = [];
    const queue = [root];

    while (queue.length) {
        const size = queue.length;
        for (let i = 0; i < size; i++) {
            const node = queue.shift();
            if (i === size - 1) res.push(node.val);
            if (node.left) queue.push(node.left);
            if (node.right) queue.push(node.right);
        }
    }

    return res;
};
```

