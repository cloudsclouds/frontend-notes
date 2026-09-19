/**
 * @param {string} num1
 * @param {string} num2
 * @return {string}
 */
var addStrings = function(num1, num2) {
    const m = num1.length;
    const n = num2.length;
    let carry = 0;
    let res = [];
    for (let i = m-1, j = n-1; i>=0 || j >= 0; i--, j--) {
        const n1 = Number(num1[i]) || 0;
        const n2 = Number(num2[j]) || 0;
        let sum = n1 + n2 + carry;
        res.push(sum%10);
        carry = Math.floor(sum/10);
    }
    if (carry)  res.push(carry);
    return res.reverse().join('');
};


/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    const myMap = new Map();
    for (let i = 0; i < nums.length; i++) {
        const need = target - nums[i];
        if (myMap.has(need))    return [myMap.get(need), i];
        else {
            myMap.set(nums[i], i);
        }
    }
};

/**
 * @param {number[]} nums
 * @return {number[][]}
 */
var permute = function(nums) {
    const n = nums.length;
    const res = [];
    const visited = Array(n).fill(false);

    const dfs = (path) => {
        if (path.length === n)  {
            res.push([...path]);
            return ;
        }

        for (let i = 0; i < n; i++) {
            if (!visited[i]) {
               visited[i] = true;
               path.push(nums[i]);
               dfs(path);
               path.pop();
               visited[i] = false; 
            }
        }
    }

    dfs([]);
    return res;
};