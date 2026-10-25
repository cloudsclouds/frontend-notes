/**
 * @param {string[]} strs 
 * @return {string[][]}
 */
var groupAnagrams = function(strs) {
    const myMap = new  Map();
    for (let str of strs) {
        const key = str.split('').sort().join('');
        if (!myMap.has(key)) {
            myMap.set(key, []);
        }
        myMap.get(key).push(str);
    }
    return Array.from(myMap.values());
};