var isValid = function(s) {
    const myMap = {
        '}':'{',
        ']':'[',
        ')':'('
    }
    const myStack = [];

    for (const ch of s) {
        if (ch === ']' || ch === ')' || ch === '}') {
            if (myStack.length > 0) {
                const node = myStack.pop();
                if (myMap[ch] !== node)  return false;
            } else {
                return false;
            }
        } else {
            myStack.push(ch);
        }
    }
    return myStack.length === 0 ? true : false;
}