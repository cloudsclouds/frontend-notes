# 数组
## 1. 合并两个有序数组 (T3)
```js
var merge = function(nums1, m, nums2, n) {
    let p = m - 1, q = n - 1;
    let k = m + n - 1;
    while (p >= 0 && q >= 0) {
        if (nums1[p] > nums2[q]) {
            nums1[k--] = nums1[p--];
        } else {
            nums1[k--] = nums2[q--];
        }
    }
    while (q >= 0) {
        nums1[k--] = nums2[q--];
    }
    return nums1;
};
```

## 2. 合并两个有序链表 (T16)
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

## 3. 螺旋矩阵 (T21)
输入：matrix = [[1,2,3],[4,5,6],[7,8,9]]
输出：[1,2,3,6,9,8,7,4,5]
```js
var spiralOrder = function(matrix) {
    const m = matrix.length;
    const n = matrix[0].length;
    let top = 0, bottom = m - 1, left = 0, right = n - 1;
    const res = [];

    while (top <= bottom && left <= right) {
        for (let i = left; i <= right; i++) {
            res.push(matrix[top][i]);
        }
        top++;
        for (let i = top; i <= bottom; i++) {
            res.push(matrix[i][right]);
        }
        right--;
        if (top <= bottom) {
            for (let i = right; i >= left; i--) {
                res.push(matrix[bottom][i]);
            }
            bottom--;
        }
        if (left <= right) {
            for (let i = bottom; i >= top; i--) {
                res.push(matrix[i][left]);
            }
            left++;
        }
    }
    return res;
};
```

# 查找
## 4. 二分查找 (T25)
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
## 5. 快速排序 (T18)
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

    QuickSort(nums, 0, nums.length-1  );
    return nums;
};
```

## 6. 查找第 k 大 (T17)
```js
var findKthLargest = function(nums, k) {
    const quickSelect = (nums, left, right) => {
        if (left === right) return nums[left];
        const m = partition(nums, left, right);
        if (m === nums.length - k)  return nums[m];
        else if (m > nums.length - k) {
            return quickSelect(nums, left, m - 1);
        } else {
            return quickSelect(nums, m + 1, right);
        }
    }

    const partition = (nums, left, right) => {
        const randomIndex = left + Math.floor(Math.random()*(right - left + 1));
        [nums[randomIndex], nums[left]] = [nums[left], nums[randomIndex]];
        const pivot = nums[left];
        while(left < right) {
            while(left < right && nums[right] >= pivot) right--;
            nums[left] = nums[right];
            while(left < right && nums[left] <= pivot)  left++;
            nums[right] = nums[left];
        }
        nums[left] = pivot;
        return left;
    }

    return quickSelect(nums, 0, nums.length - 1);
}
```

## 选择排序
```js
function selectSort(nums) {
    const n = nums.length;
    for (let i = 0; i < n; i++) {
        let minIndex = i;
        for (let j = i + 1; j < n; j++) {
            if (nums[j] < nums[minIndex]) {
                minIndex = j;
            }
        }
        [nums[i], nums[minIndex]] = [nums[minIndex], nums[i]];
    }
    return nums;
}
```

## 冒泡排序
```js
function BubbleSort(nums) {
    const n = nums.length;
    for (let i = 0; i < n; i++) {
        let flag = true;
        for (let j = 0; j < n - i - 1; j++) {
            if (nums[j] > nums[j+1]) {
                [nums[j], nums[j+1]] = [nums[j+1], nums[j]];
                flag = false;
            }
        }
        if (flag) break;
    }
    return nums;
}
```

# 哈希 和 Set 
## 7. 两数之和 (T6)
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

## 8. 字母异位词分组
strs = ["eat", "tea", "tan", "ate", "nat", "bat"]
遍历字符串数组，把每个字符串排序后的结果作为 key。
因为字母异位词排序后是一样的，所以可以分到同一组。
用 Map 存储 key 到字符串数组的映射，最后返回所有 value 即可。
```js
var groupAnagrams = function(strs) {
    const myMap = new Map();
    for (let str of strs) {
        const key = str.split('').sort().join('');
        if (!myMap.has(key)) {
            myMap.set(key, str);
        }
        myMap.get(key).push(str);
    }
    return Array.from(myMap.values());
}
```


## 9. 最长连续序列
给定一个未排序的整数数组 nums ，找出数字连续的最长序列（不要求序列元素在原数组中连续）的长度。
示例 1：
输入：nums = [100,4,200,1,3,2]
输出：4
解释：最长数字连续序列是 [1, 2, 3, 4]。它的长度为 4。

```js
var longestConsecutive = function(nums) {
    const mySet = new Set(nums);
    let maxLen = 0;
    for (let num of nums) {
        // num 是序列起点
        if (!mySet.has(num-1)) {
            let current = num;
            let len = 1;
            while(mySet.has(current+1)) {
                current++;
                len++;
            }
            maxLen = Math.max(maxLen, len);
        }
    }
    return maxLen;
}
```


# 双指针
## 10. 移动零

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

## 11. 三数之和 (T12)
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

## 12. 接雨水
给定一个非负整数数组 height，表示每个位置的柱子高度，宽度都为 1。下雨后，求这些柱子之间一共能接多少单位的雨水。
输入：height = [0,1,0,2,1,0,1,3,2,1,2,1]
输出：6

用双指针 left / right 维护：leftMax（左边最高） 、rightMax（右边最高）
某位置能接的水 = min(左侧最大值, 右侧最大值) - 当前高度
```js
var trap = function(height) {
    let left = 0, right = height.length - 1;
    let leftMax = 0, rightMax = 0;
    let res = 0;

    while (left < right) {
        if (height[left] < height[right]) {
            leftMax = Math.max(leftMax, height[left]);
            res += leftMax - height[left];
            left++;
        } else {
            rightMax = Math.max(rightMax, height[right]);
            res += rightMax - height[right];
            right--;
        }
    }
    return res;
};
```


# 贪心

## 13. 买卖股票的最佳时机 (T11)
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

## 14. 跳跃游戏

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
## 15. 爬楼梯 (T20)
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

## 16. 打家劫舍

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

## 17. 最大子数组和 (T10)
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

## 18. 最长递增子序列 (T23)
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

## 背包问题
### 0-1背包
```
dp[j] = 容量为j时的最大价值 = max(不选当前物品, 选当前物品)
```
必须：倒序，否则：一个物品会被重复选

```js
for (let i = 0; i < n; i++) {
    for (let j = W; j >= weight[i]; j--) {
        dp[j] = Math.max(dp[j], dp[j-weight[i]] + value[i])
    }
}
```

### 完全背包
```js
for (let i = 0; i < n; i++) {
    for (let j = weight[i]; j <= W; j++) {
        dp[j] = Math.max(dp[j], dp[j-weight[i]] + value[i])
    }
}
```

## 完全平方数
给你一个正整数 n，找到若干个完全平方数之和等于 n，并且要求使用的数量最少。
dp[i] = 凑成数字 i 所需的最少完全平方数个数
```js
var numSquares = function(n) {
    const dp = new Array(n+1).fill(Infinity);
    for (let i = 0; i <= n; i++) {
        for (let j = 1; j*j <= i; j++) {
            dp[i] = Math.min(dp[i], dp[i-j*j]+1);
        }
    }
    return dp[n];
}
```

## 最大乘积子数组
```
maxDp[i] = 以 i 结尾的最大乘积
minDp[i] = 以 i 结尾的最小乘积
maxDp[i] = max( nums[i], nums[i] * maxDp[i-1], nums[i] * minDp[i-1])
minDp[i] = min( nums[i], nums[i] * maxDp[i-1], nums[i] * minDp[i-1])
```

```js
var maxProduct = function(nums) {
    const n = nums.length;
    let max = nums[0];
    let min = nums[0];
    let res = nums[0];

    for (let i = 1; i < n; i++) {
        const cur = nums[i];
        let tempMax = Math.max(cur, cur * max, cur * min);
        let tempMin = Math.min(cur, cur * max, cur * min);

        max = tempMax;
        min = tempMin;

        res = Math.max(res, max);
    }
    return res;
}
```


## 19. 零钱兑换
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

## 20. 不同路径

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

## 21. 最小路径和

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

## 22. 最长回文子串 (T19)
```js
// dp[i][j] = s[i..j] 是否是回文

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

## 23. 最长公共子序列

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
## 进制转换
```js
var convertToBaseN = function(num, base) {
  if (num === 0) return '0'
  const digits = '0123456789ABCDEF'
  let res = ''
  while (num > 0) {
    res = digits[num % base] + res
    num = Math.floor(num / base)
  }
  return res
};
```

## 24. 版本比较 (T2)
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

## 25. 字符串相加 (T5)
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

## 26. 有效的回文串
```js
var isPalindrome = function(s) {
  s = s.toLowerCase().replace(/[^a-z0-9]/g, '')
  let left = 0, right = s.length - 1;
  while (left < right) {
    if (s[left++] !== s[right--]) return false;
  }
  return true;
};
```

## 27. 最长公共前缀
```js
var longestCommonPrefix = function(strs) {
    let prefix = strs[0];
    for (let i = 1; i < strs.length; i++) {
        while (strs[i].indexOf(prefix) !== 0) {
            prefix = prefix.slice(0, prefix.length-1);
            if (prefix === '')  return '';
        }
    }
    return prefix;
};
```

## 字符串相乘
```js
var multiply = function(num1, num2) {
    // 1️⃣ 特殊情况
    if (num1 === "0" || num2 === "0") return "0";

    const m = num1.length;
    const n = num2.length;

    // 2️⃣ 结果数组（最多 m + n 位）
    const res = Array(m + n).fill(0);

    // 3️⃣ 从个位开始（倒序）
    for (let i = m - 1; i >= 0; i--) {
        for (let j = n - 1; j >= 0; j--) {

            // 当前位乘积
            const mul = (num1[i] - '0') * (num2[j] - '0');

            // 对应位置
            const p1 = i + j;
            const p2 = i + j + 1;

            // 累加（注意可能之前已经有值）
            const sum = mul + res[p2];

            // 个位放 p2
            res[p2] = sum % 10;

            // 十位进位到 p1
            res[p1] += Math.floor(sum / 10);
        }
    }

    // 4️⃣ 去掉前导 0
    let result = res.join('');
    if (result[0] === '0') {
        result = result.slice(1);
    }

    return result;
};
```


# 滑动窗口
## 28. 无重复字符的最长子串 (T1)
```js
var lengthOfLongestSubstring = function(s) {
    const n = s.length;
    let ans = 0, right = -1;
    const mySet = new Set();  // 存储当前窗口内的字符
    for (let left = 0; left < n; left ++){
        // 当left从left-1移动到left时，原左边界s[left-1]不再属于当前窗口，
        // 需要从occ中移除，确保occ只包含[left, right]
        if (left !== 0){
            mySet.delete(s[left-1]);
        }
        // left 固定，右指针right尽可能向右，直到遇到重复字符或到达字符串末尾
        while (right + 1 < n && !mySet.has(s[right+1])){
            mySet.add(s[right+1]);
            right++;
        }
        ans = Math.max(ans, right - left + 1);
    }
    return ans;
}
```

## 29. 合并区间 (T24)
给出一个区间的集合 intervals，其中每个区间 intervals[i] = [starti, endi]。
请你合并所有重叠的区间，并返回一个不重叠的区间数组。
输入：intervals = [[1,3],[2,6],[8,10],[15,18]]
输出：[[1,6],[8,10],[15,18]]

```js
var merge = function(intervals) {
    if (!intervals.length)  return [];
    intervals.sort((a,b) => a[0] - b[0]);
    let [start, end] = intervals[0];
    const res = [];

    for (let i = 1; i < intervals.length; i++) {
        let [currentStart, currentEnd] = intervals[i];
        if (currentStart <= end) {
            end = Math.max(end, currentEnd);     
        } else {
            res.push([start, end]);
            start = currentStart;
            end = currentEnd;
        }
    }
    res.push([start, end]);
    return res;
}
```

## 330. 长度最小的子数组
给定一个含有 n 个正整数的数组和一个正整数 target 。
找出该数组中满足其总和大于等于 target 的长度最小的 子数组 [nums(l), nums(l+1), ..., nums(r-1), nums(r)] ，并返回其长度。如果不存在符合条件的子数组，返回 0 。
```js
var minSubArrayLen = function(target, nums) {
    let left = 0;
    let sum = 0;
    let minLen = Infinity;

    for (let right = 0; right < nums.length; right++) {
        sum += nums[right];

        // 当窗口满足条件时，尽量收缩
        while (sum >= target) {
            minLen = Math.min(minLen, right - left + 1);
            sum -= nums[left];
            left++;
        }
    }

    return minLen === Infinity ? 0 : minLen;
};
```

# 栈
## 31. 有效的括号 (T4)
```js
var isValid = function(s) {
    const myMap = {
        ']': '[',
        '}': '{',
        ')': '('
    }
    const myStack = []; // 栈一定要这样初始化
    for (let i = 0; i < s.length; i++) {
        if (s[i] === ']' || s[i] === '}' || s[i] === ')') {
            if (!myStack.length) return false;
            const top = myStack.pop();
            if (myMap[s[i]] !== top) return false;
        } else {
            myStack.push(s[i]);
        }
    }
    return myStack.length === 0 ? true : false;
}
```

## 32. LRU (T13)
```js
var LRUCache = function(capacity) {
    this.capacity = capacity
    this.map = new Map()
};

LRUCache.prototype.get = function(key) {
    if (!this.map.has(key)) return -1;
    const value = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, value);
    return value;
};

LRUCache.prototype.put = function(key, value) {
    if (this.map.has(key)) {
        this.map.delete(key);
    } else if (this.map.size >= this.capacity) {
        this.map.delete(this.map.keys().next().value);  // map.keys() 返回一个迭代器（Iterator）,迭代器通过 next() 获取下一个元素。
    }
    this.map.set(key, value);
};
```

## 最小栈
设计一个支持 push ，pop ，top 操作，并能在常数时间内检索到最小元素的栈。
实现 MinStack 类:
- MinStack() 初始化堆栈对象。
- void push(int val) 将元素val推入堆栈。
- void pop() 删除堆栈顶部的元素。
- int top() 获取堆栈顶部的元素。
- int getMin() 获取堆栈中的最小元素。
```js
var MinStack = function() {
    this.stack = [];
    this.minStack = [];
};

MinStack.prototype.push = function(val) {
    this.stack.push(val);
    if (this.minStack.length === 0) {
        this.minStack.push(val);
    } else {
        const min = this.minStack[this.minStack.length - 1];
        this.minStack.push(Math.min(val, min));
    }
};

MinStack.prototype.pop = function() {
    this.stack.pop();
    this.minStack.pop();
};

MinStack.prototype.top = function() {
    return this.stack[this.stack.length - 1];
};

MinStack.prototype.getMin = function() {
    return this.minStack[this.minStack.length - 1];
};
```

## 字符串解码
给定一个经过编码的字符串 s，返回它解码后的字符串。
编码规则为：
- k[encoded_string]
- 表示括号中的字符串 encoded_string 会重复 k 次
- k 保证是正整数
- 输入字符串总是有效的，没有多余空格
```
输入：s = "3[a]2[bc]"
输出："aaabcbc"
```
```js
var decodeString = function(s) {
    const numStack = [];
    const strStack = [];
    let res = '';
    let num = 0;

    for (const ch of s) {
        if (ch >= '0' && ch <= '9') {
             // 构建数字（处理多位数情况）
            num = num * 10 + Number(ch);
        } else if (ch === "["){
            // 把重复次数压栈
            numStack.push(num); 
             // 把当前已经构建的字符串压栈
            strStack.push(res);
            num = 0;
            res = "";
        } else if (ch === ']') {
            // 取出最近的重复次数
            let repeatTimes = numStack.pop();
             // 取出进入当前括号前的字符串
            let prevStr = strStack.pop();
            res = prevStr + res.repeat(repeatTimes);
        } else {
            res += ch;
        }
    }
    return res;
};
```


# 链表
## 33. 反转链表 (T8)
```js
var reverseList = function(head) {
    let pre = null, p = head;
    while(p) {
        const next = p.next;
        p.next = pre;
        pre = p;
        p = next;
    }
    return pre;
}
```

## 34. 环形链表 (T14)
```js
var hasCycle = function(head) {
    let fast = head, slow = head;
    while(fast && fast.next) {
        fast = fast.next.next;
        slow = slow.next;
        if (fast === slow)  return true;
    }
    return false;
}
```

## 35. 删除链表倒数第N个节点
> dummy 节点用于统一链表操作，特别是在删除头节点时，可以避免单独处理边界情况，使代码更加简洁和安全。
```js
var removeNthFromEnd = function(head, n) {
    const dummy = new ListNode(0, head);
    let left = dummy, right = dummy;
    while(n--){
        right = right.next;
    }
    while(right.next){
        left = left.next;
        right = right.next;
    }
    left.next = left.next.next;
    return dummy.next;
};
```

## 36. k 个一组反转链表
```js
var reverseKGroup = function(head, k) {
    let node = head;
    for (let i = 0; i < k; i++) {
        if (!node) return head;
        node = node.next;
    }

    // 反转前 k 个节点
    let prev = null;
    let curr = head;

    for (let i = 0; i < k; i++) {
        let next = curr.next;
        curr.next = prev;
        prev = curr;
        curr = next;
    }

    // 执行完后：prev 是这一组反转后的新头，head 变成了这一组反转后的尾
    // 递归处理剩余链表
    head.next = reverseKGroup(curr, k);

    // 返回新头
    return prev;

}
```

## 37. 相交链表
```js
var getIntersectionNode = function(headA, headB) {
    if (headA == null || headB = null)  return null;
    let pA = headA, pB = headB;
    while(pA !== pB) {
        pA = pA === null ? headB : pA.next;
        pB = pB === null ? headA : pB.next;
    }
    return pA;
}
```

## 38. 两数相加
```js
var addTwoNumbers = function(l1, l2) {
    let dummy = new ListNode(0);
    let cur = dummy;

    let carry = 0;

    while (l1 || l2 || carry) {
        const val1 = l1 ? l1.val : 0;
        const val2 = l2 ? l2.val : 0;

        const sum = val1 + val2 + carry;

        carry = Math.floor(sum / 10);
        const newVal = sum % 10;

        cur.next = new ListNode(newVal);
        cur = cur.next;

        if (l1) l1 = l1.next;
        if (l2) l2 = l2.next;
    }

    return dummy.next;
};
```

## 39. 重排链表
给定一个单链表 L0 → L1 → ... → Ln-1 → Ln，
请将其重新排列为：
L0 → Ln → L1 → Ln-1 → L2 → Ln-2 → ...

- 找中点：用快慢指针找到链表中间
- 反转后半段：把后半段链表原地反转
- 合并两个链表：交替合并


```js
var reorderList = function(head) {
    if (!head || !head.next)    return;

    // 1. 找中点
    let slow = head, fast = head;
    while(fast && fast.next) {
        slow = slow.next;
        fast = fast.next.next;
    }

    // 2. 反转后半段
    let pre = null;
    let curr = slow.next;
    slow.next = null;
    while (curr) {
        const next = curr.next;
        curr.next = prev;
        prev = curr;
        curr = next;
    }

    // 3. 合并两个链表
    let first = head;
    let second = prev;

    while (second) {
        const temp1 = first.next;
        const temp2 = second.next;
        first.next = second;
        second.next = temp1;
        first = temp1;
        second = temp2;
    }
}
```


# 二叉树

## DFS 遍历

### 40. 中序 / 前序 / 后序通用模板
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

### 41. 二叉树的中序遍历
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

### 42. 路径总和 (T15)
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

### 43. 二叉树的所有路径
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

### 44. 求根到叶子节点数字之和 (T26)
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

### 45. 二叉树的最大深度
```js
var maxDepth = function(root) {
    if (!root) return 0;
    const left = maxDepth(root.left);
    const right = maxDepth(root.right);
    return Math.max(left, right) + 1;
};
```

### 46. 二叉树的最大直径
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

### 47. 二叉树的最近公共祖先
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

### 48. 反转二叉树
```js
var flipTree = function(root) {
    if (!root) return null;
    [root.left, root.right] = [root.right, root.left];
    flipTree(root.left);
    flipTree(root.right);
    return root;
};
```

### 49. 对称二叉树
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

### 50. 从前序与中序遍历序列构造二叉树
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
### 51. 二叉树的层序遍历 (T9)
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

### 52. 锯齿形层次遍历
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

### 53. 二叉树的右视图
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

# 回溯
## 54. 全排列 (T7)
```js
var permute = function(nums) {
    const n = nums.length;
    const res = [];
    const visited = Array(n).fill(false);

    const backtrack = (path) => {
        if (path.length === n) {
            res.push([...path]);
            return;
        }

        for (let i = 0; i < n; i++) {
            if (!visited[i]) {
                visited[i] = true;
                path.push(nums[i]);
                backtrack(path)
                path.pop();
                visited[i] = false;
            }
        }
    }
    backtrack([]);
    return res;
};
```

## 55. 子集
给你一个整数数组 nums ，数组中的元素 互不相同 。返回该数组所有可能的子集（幂集）。
解集 不能 包含重复的子集。你可以按 任意顺序 返回解集。

```js
var subsets = function(nums) {
    const res = [];
    const dfs = (start, path) => {
        res.push([...path]);

        for (let i = start; i < nums.length; i++) {
            path.push(nums[i]);
            dfs(i+1, path);
            path.pop();
        }
    }
    dfs(0, []);
    return res;
};
```

## 56. 组合总和
给定一个候选人编号的集合 candidates 和一个目标数 target ，找出 candidates 中所有可以使数字和为 target 的组合。
candidates 中的每个数字在每个组合中只能使用 一次 。
注意：解集不能包含重复的组合。 
输入: `candidates = [10,1,2,7,6,1,5], target = 8`,
输出:
```
[
[1,1,6],
[1,2,5],
[1,7],
[2,6]
]
```

```js
var combinationSum2 = function(candidates, target) {
    const res = [];
    candidates.sort((a,b) => a-b);

    const dfs = (start, path, sum) => {
        if (sum === target) {
            res.push([...path]);
            return;
        }
        
        if (sum > target)   return;

        for (let i = start; i < candidates.length; i++) {
            if (i > start && candidates[i] === candidates[i-1])     continue;

            path.push(candidates[i]);
            dfs(i+1, path, sum + candidates[i]);
            path.pop();
        }
    }
    dfs(0, [], 0);
    return res;
};
```

## 57. 岛屿数量 (T22)
给你一个由 '1'（陆地）和 '0'（水）组成的二维网格 grid，请你计算网格中岛屿的数量。
岛屿由水平方向或竖直方向相邻的陆地连接形成。
你可以假设网格的四周被水包围。
```
输入：
grid = [
  ["1","1","1","1","0"],
  ["1","1","0","1","0"],
  ["1","1","0","0","0"],
  ["0","0","0","0","0"]
]
输出：1
```

```js
var numIslands = function(grid) {
    const m = grid.length;
    const n = grid[0].length;
    let count = 0;

    const dfs = (i, j) => {
        if (i < 0 || j < 0 || i >= m || j >= n || grid[i][j] === '0') {
            return;
        }

        grid[i][j] = '0';
        dfs(i+1, j);
        dfs(i-1, j);
        dfs(i, j+1);
        dfs(i, j-1);
    }

    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            if (grid[i][j] === '1') {
                count++;
                dfs(i, j);
            }
        }
    }

    return count;
}
```

## 58. 岛屿的最大面积
```js
var maxAreaOfIsland = function(grid) {
    const m = grid.length;
    const n = grid[0].length;
    let res = 0;
    
    const dfs = (i, j) => {
        if (i < 0 || i >= m || j < 0 || j >= n || grid[i][j] === 0) {
            return 0;
        }
        grid[i][j] = 0;
        return 1 + dfs(i-1, j) + dfs(i+1, j) + dfs(i, j-1) + dfs(i, j+1);
    }

    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            if (grid[i][j] === 1) {
                res = Math.max(res, dfs(i,j));
            }
        }
    }
    return res;
}
```

## 59. 括号生成
每一步可以选择放左括号或右括号，但需要满足两个约束：
- 左括号数量不能超过 n
- 右括号数量不能超过左括号
- 当字符串长度达到 2n 时说明生成了一个合法括号序列。
```js
var generateParenthesis = function(n) {
    const res = [];
    const dfs = (str, left, right) => {
        if (str.length === 2 * n) {
            res.push([...str]);
            return;
        }

        if (left < n) {
            dfs(str + '(', left + 1, right);
        }

        if (right < left) {
            dfs(str + ')', left, right + 1);
        }
    }

    dfs("", 0, 0);
    return res;
}
```

## 60. 复原 IP 地址
给定一个只包含数字的字符串 s，通过在字符串中插入 . 将其分割成 4 个整数段，判断能否组成一个合法的 IP 地址。
合法 IP 段要求
- 每段长度 1~3
- 不能有前导零，除非这一段就是 0
- 每段数字范围 0 ~ 255

输入：s = "25525511135"
输出：["255.255.11.135","255.255.111.35"]

```js
var restoreIpAddresses = function(s) {
    const res = [];

    const dfs = (start, path) => {
        if (path.length === 4 && start === s.length) {
            res.push(path.join('.'));
            return;
        }

        let remaining = s.length - start; // 还剩多少字符没用
        let segmentsLeft = 4 - path.length; // 还需要分成多少段

        if (remaining < segmentsLeft || remaining > segmentsLeft * 3) {
            return ;
        }

        for (let len = 1; len <= 3; len++) {
            if (start + len > s.length) break;
            let segment = s.slice(start, start + len);
            if (segment.length > 1 && segment[0] === '0')   continue;

            if (Number(segment) > 255)  continue;
            path.push(segment);
            dfs(start+len, path);
            path.pop();
        }
    }
    dfs(0, []);
    return res;
};
```