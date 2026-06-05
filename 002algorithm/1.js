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

console.log(merge([1,2,3,0,0,0], 3, [2,5,6], 3));