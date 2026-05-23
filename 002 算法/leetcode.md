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