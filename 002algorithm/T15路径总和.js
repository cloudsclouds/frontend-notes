var hasPathSum = function(root, targetSum) {
    if (!root)  return false;
    if (!root.left && !root.right) {
        return root.val === targetSum;
    }
    const nextTargt = targetSum - root.val;
    return hasPathSum(root.left, nextTargt) || hasPathSum(root.right, nextTargt)
}