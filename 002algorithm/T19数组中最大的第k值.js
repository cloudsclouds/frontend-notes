var findKthLargest = function(nums, k) {
    const QuickSort = (nums, left, right) => {
        if (left === right)  return nums[left];
        const m = partition(nums, left, right);
        if (m === nums.length - k)  return nums[m];
        else if (m > nums.length - k)
            return QuickSort(nums, left, m-1);
        else
            return QuickSort(nums, m+1, right);
    }

    const partition = (nums, left, right) => {
        const randomIndex = left + Math.floor(Math.random()*(right - left + 1));
        [nums[left], nums[randomIndex]] = [nums[randomIndex], nums[left]];
        const pivot = nums[left];
        while (left < right) {
            while (left < right && nums[right] >= pivot) right--;
            nums[left] = nums[right];
            while (left < right && nums[left] <= pivot) left++;
            nums[right] = nums[left];
        } 
        nums[left] = pivot;
        return left;
    }

    return QuickSort(nums, 0, nums.length-1);
}