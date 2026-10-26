/**
 * LeetCode 17. 电话号码的字母组合
 * @param {string} digits
 * @return {string[]}
 */
var letterCombinations = function(digits) {
    if (digits.length === 0) return [];

    const map = {
        "2": "abc",
        "3": "def",
        "4": "ghi",
        "5": "jkl",
        "6": "mno",
        "7": "pqrs",
        "8": "tuv",
        "9": "wxyz"
    };

    const res = [];
    let path = "";

    function dfs(index) {
        if (index === digits.length) {
            res.push(path);
            return;
        }

        const letters = map[digits[index]];
        for (const ch of letters) {
            path += ch;
            dfs(index + 1);
            path = path.slice(0, -1);
        }
    }

    dfs(0);
    return res;
};
