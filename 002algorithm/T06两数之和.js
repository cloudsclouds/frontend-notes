var twoSum = function(nums, target) {
    const myMap = new Map();
    const n = nums.length;
    for (let i = 0; i < n; i++) {
        const need = target - nums[i];
        if (myMap.has(need))    {
            return [i, myMap.get(need)];
        } else {
            myMap.set(nums[i], i);
        }
    }
}