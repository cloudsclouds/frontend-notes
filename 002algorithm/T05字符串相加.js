var addStrings = function(num1, num2) {
    const n1 = num1.length;
    const n2 = num2.length;
    let carry = 0;
    const res = [];
    for (let i = n1-1, j = n2-1; i >= 0 || j >= 0; i--, j--) {
        const r1 = Number(num1[i]) || 0;
        const r2 = Number(num2[j]) || 0;
        const sum = r1 + r2 + carry;
        res.push(sum % 10);
        carry = Math.floor(sum / 10);
    }
    if (carry > 0)  res.push(carry);
    return res.reverse().join('')
}