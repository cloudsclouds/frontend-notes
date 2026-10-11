var compareVersion = function(version1, version2) {
    const v1 = version1.split('.');
    const v2 = version2.split('.');
    for (let i = 0; i < v1.length || i < v2.length; i++) {
        const num1 = Number(v1[i]) || 0;
        const num2 = Number(v2[i]) || 0;
        if (num1 < num2)    return -1;
        else if (num1 > num2)   return 1;
    }
    return 0;
}